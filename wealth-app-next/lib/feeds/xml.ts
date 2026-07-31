// ─────────────────────────────────────────────────────────────────
// Minimal read-only XML parser for ISO 20022 camt payloads.
//
// Deliberately hand-rolled rather than pulling a dependency or reaching
// for a DOM implementation, because the security properties matter more
// here than completeness: this parses bytes fetched from a user-supplied
// endpoint.
//
//   • DOCTYPE / ENTITY declarations are SKIPPED, never processed, so
//     XXE (<!ENTITY xxe SYSTEM "file:///etc/passwd">) and billion-laughs
//     entity expansion are impossible by construction — there is no
//     entity table to poison and no external resolution path.
//   • Only the five predefined XML entities plus numeric character
//     references are decoded.
//   • Node depth is capped, so a pathologically nested document cannot
//     blow the stack.
//
// It supports exactly what camt needs: element tree, local names
// (namespace prefixes ignored), attributes, and text content.
// ─────────────────────────────────────────────────────────────────

const MAX_DEPTH = 100;

export class XmlNode {
  constructor(
    readonly name: string,
    readonly attrs: Record<string, string>,
    readonly children: XmlNode[],
    private textContent: string
  ) {}

  /** Set by the parser when the element's closing tag is reached. */
  setText(value: string): void { this.textContent = value; }

  /** Concatenated text of this node and its descendants. */
  text(): string {
    if (!this.children.length) return this.textContent.trim();
    return (this.textContent + this.children.map((c) => c.text()).join("")).trim();
  }

  attr(name: string): string {
    const key = Object.keys(this.attrs).find((k) => localName(k) === name);
    return key ? this.attrs[key] : "";
  }

  /** All descendants (any depth) whose local name matches. */
  find(name: string): XmlNode[] {
    const out: XmlNode[] = [];
    const walk = (n: XmlNode) => {
      for (const c of n.children) {
        if (c.name === name) out.push(c);
        walk(c);
      }
    };
    walk(this);
    return out;
  }

  /** First descendant with this local name, depth-first. */
  first(name: string): XmlNode | null {
    for (const c of this.children) {
      if (c.name === name) return c;
      const nested = c.first(name);
      if (nested) return nested;
    }
    return null;
  }
}

function localName(qualified: string): string {
  const i = qualified.indexOf(":");
  return i >= 0 ? qualified.slice(i + 1) : qualified;
}

function decodeEntities(s: string): string {
  return s.replace(/&(#x?[0-9a-fA-F]+|amp|lt|gt|quot|apos);/g, (whole, ent: string) => {
    switch (ent) {
      case "amp": return "&";
      case "lt": return "<";
      case "gt": return ">";
      case "quot": return '"';
      case "apos": return "'";
      default: {
        // Numeric character reference — bounded, no entity table involved.
        const code = ent[1] === "x" || ent[1] === "X"
          ? parseInt(ent.slice(2), 16)
          : parseInt(ent.slice(1), 10);
        return Number.isFinite(code) && code >= 0 && code <= 0x10ffff
          ? String.fromCodePoint(code)
          : whole;
      }
    }
  });
}

export class XMLParser {
  constructor(private readonly source: string) {}

  /** Returns the root node, or null if the document is not well-formed. */
  parse(): XmlNode | null {
    const src = this.source;
    const root = new XmlNode("#document", {}, [], "");
    const stack: Array<{ node: XmlNode; children: XmlNode[]; text: string }> = [
      { node: root, children: root.children, text: "" },
    ];
    let i = 0;
    let sawElement = false;

    while (i < src.length) {
      const lt = src.indexOf("<", i);
      if (lt < 0) break;

      // Text content between tags belongs to the open element.
      if (lt > i && stack.length > 1) {
        stack[stack.length - 1].text += src.slice(i, lt);
      }

      // Declarations we skip wholesale — this is the XXE defence.
      if (src.startsWith("<!--", lt)) {
        const end = src.indexOf("-->", lt + 4);
        if (end < 0) return null;
        i = end + 3;
        continue;
      }
      if (src.startsWith("<![CDATA[", lt)) {
        const end = src.indexOf("]]>", lt + 9);
        if (end < 0) return null;
        if (stack.length > 1) stack[stack.length - 1].text += src.slice(lt + 9, end);
        i = end + 3;
        continue;
      }
      if (src.startsWith("<!", lt)) {
        // DOCTYPE (possibly with an internal subset) — skipped, never parsed.
        let depth = 0, j = lt;
        for (; j < src.length; j++) {
          const ch = src[j];
          if (ch === "[") depth++;
          else if (ch === "]") depth--;
          else if (ch === ">" && depth <= 0) break;
        }
        if (j >= src.length) return null;
        i = j + 1;
        continue;
      }
      if (src.startsWith("<?", lt)) {
        const end = src.indexOf("?>", lt + 2);
        if (end < 0) return null;
        i = end + 2;
        continue;
      }

      const gt = src.indexOf(">", lt);
      if (gt < 0) return null;
      let tag = src.slice(lt + 1, gt).trim();

      // Closing tag
      if (tag.startsWith("/")) {
        const name = localName(tag.slice(1).trim());
        if (stack.length < 2) return null;
        const top = stack[stack.length - 1];
        if (top.node.name !== name) return null;   // mismatched nesting
        top.node.setText(decodeEntities(top.text));
        stack.pop();
        i = gt + 1;
        continue;
      }

      const selfClosing = tag.endsWith("/");
      if (selfClosing) tag = tag.slice(0, -1).trim();

      const spaceIdx = tag.search(/\s/);
      const rawName = spaceIdx < 0 ? tag : tag.slice(0, spaceIdx);
      const name = localName(rawName);
      if (!name) return null;

      const attrs: Record<string, string> = {};
      if (spaceIdx >= 0) {
        const attrSrc = tag.slice(spaceIdx);
        for (const m of attrSrc.matchAll(/([\w:.-]+)\s*=\s*("([^"]*)"|'([^']*)')/g)) {
          attrs[m[1]] = decodeEntities(m[3] ?? m[4] ?? "");
        }
      }

      const node = new XmlNode(name, attrs, [], "");
      stack[stack.length - 1].children.push(node);
      sawElement = true;

      if (!selfClosing) {
        if (stack.length >= MAX_DEPTH) return null;
        stack.push({ node, children: node.children, text: "" });
      }
      i = gt + 1;
    }

    if (!sawElement) return null;
    if (stack.length !== 1) return null;   // unclosed elements
    return root;
  }
}
