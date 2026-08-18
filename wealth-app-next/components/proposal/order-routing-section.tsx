"use client";

import { useState } from "react";

import type { Proposal } from "@/lib/orders/proposal";

import {
  buildTicket,
  checkProposal,
} from "@/lib/orders/proposal";

type Props = {
  proposal: Proposal;
};

export function OrderRoutingSection({
  proposal,
}: Props) {
  const [pmSystemName, setPmSystemName] =
    useState("");

  const [endpointUrl, setEndpointUrl] =
    useState("");

  const [accountId, setAccountId] =
    useState("");

  const [custodian, setCustodian] =
    useState("");

  const [currency, setCurrency] =
    useState(
      proposal.currency || "USD"
    );

  const [authType, setAuthType] =
    useState("none");

  const [reviewOpen, setReviewOpen] =
    useState(false);

  const [ticketId, setTicketId] =
    useState<string | null>(null);

  const problems =
    checkProposal(proposal);

  const errors =
    problems.filter(
      (problem) =>
        problem.level === "error"
    );

  const warnings =
    problems.filter(
      (problem) =>
        problem.level === "warning"
    );

  const canBuildTicket =
    errors.length === 0 &&
    accountId.trim().length > 0;

  function reviewOrderTicket() {
    if (!canBuildTicket) {
      return;
    }

    const id =
      ticketId ??
      crypto.randomUUID();

    setTicketId(id);

    setReviewOpen(true);
  }

  const ticket =
    reviewOpen && ticketId
      ? buildTicket(proposal, {
          ticketId,

          account:
            accountId,

          custodian:
            custodian.trim() ||
            undefined,

          createdAt:
            new Date().toISOString(),
        })
      : null;

  return (
    <section className={sectionClass}>
      <h2 className={titleClass}>
        Send to Portfolio Management System
      </h2>

      <p className="mb-5 text-[11px] leading-5 text-[#64748b]">
        Turns the positions above into a
        BUY order ticket and sends it to
        your PM/OMS, where the orders sit
        as pending instructions for
        someone with trading authority to
        execute. Nothing is executed from
        this screen.
      </p>

      <div className="rounded-lg border border-[rgba(0,87,184,.08)] bg-[#f8faff] p-4">
        <button
          type="button"
          onClick={reviewOrderTicket}
          disabled={!canBuildTicket}
          className={buyButtonClass}
        >
          BUY — review order ticket
        </button>

        <div className="mt-3 text-[11px] text-[#64748b]">
          {!accountId.trim()
            ? "Set a custody account / portfolio ID before reviewing the ticket."
            : errors.length > 0
              ? `${errors.length} proposal error(s) must be fixed first.`
              : "Proposal is ready for order-ticket review."}
        </div>
      </div>

      {problems.length > 0 && (
        <div className="mt-4 space-y-2">
          {problems.map(
            (problem, index) => (
              <div
                key={`${problem.positionId ?? "proposal"}-${index}`}
                className={
                  problem.level ===
                  "error"
                    ? errorClass
                    : warningClass
                }
              >
                {problem.message}
              </div>
            )
          )}
        </div>
      )}

      <div className="my-6 border-t border-[rgba(0,87,184,.08)]" />

      <h3 className="mb-2 text-[11px] font-bold uppercase tracking-[0.08em] text-[#64748b]">
        Order Routing
      </h3>

      <p className="mb-4 text-[11px] leading-5 text-[#9ca3af]">
        Where order tickets are sent.
        Configure the PM or order
        management system used by the
        firm.
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        <label>
          <span className={labelClass}>
            PM system name
          </span>

          <input
            type="text"
            value={pmSystemName}
            onChange={(e) =>
              setPmSystemName(
                e.target.value
              )
            }
            placeholder="e.g. Avaloq"
            className={inputClass}
          />
        </label>

        <label>
          <span className={labelClass}>
            Order endpoint URL
          </span>

          <input
            type="url"
            value={endpointUrl}
            onChange={(e) =>
              setEndpointUrl(
                e.target.value
              )
            }
            placeholder="https://pm.example.com/api/orders"
            className={inputClass}
          />
        </label>

        <label>
          <span className={labelClass}>
            Payload format
          </span>

          <select
            className={inputClass}
            value="wa.order/v1"
            disabled
          >
            <option value="wa.order/v1">
              wa.order/v1 (native)
            </option>
          </select>
        </label>

        <label>
          <span className={labelClass}>
            Custody account / portfolio ID
          </span>

          <input
            type="text"
            value={accountId}
            onChange={(e) =>
              setAccountId(
                e.target.value
              )
            }
            placeholder="e.g. CH-8842-01"
            className={inputClass}
          />
        </label>

        <label>
          <span className={labelClass}>
            Custodian
          </span>

          <input
            type="text"
            value={custodian}
            onChange={(e) =>
              setCustodian(
                e.target.value
              )
            }
            placeholder="optional"
            className={inputClass}
          />
        </label>

        <label>
          <span className={labelClass}>
            Order currency
          </span>

          <input
            type="text"
            maxLength={3}
            value={currency}
            onChange={(e) =>
              setCurrency(
                e.target.value.toUpperCase()
              )
            }
            className={inputClass}
          />
        </label>

        <label>
          <span className={labelClass}>
            Auth
          </span>

          <select
            value={authType}
            onChange={(e) =>
              setAuthType(
                e.target.value
              )
            }
            className={inputClass}
          >
            <option value="none">
              None
            </option>

            <option value="bearer">
              Bearer token
            </option>

            <option value="api_key">
              API key
            </option>
          </select>
        </label>
      </div>

      <button
        type="button"
        className={secondaryButtonClass}
        onClick={() => {
          // Add persistence later.
        }}
      >
        Save routing
      </button>

      <p className="mt-4 text-[11px] leading-5 text-[#9ca3af]">
        For production bank-hosted OMS
        integrations, send through the
        server-side relay so credentials
        do not need to live in the
        browser.
      </p>

      <div className="mt-6 border-t border-[rgba(0,87,184,.08)] pt-4">
        <div className="text-[11px] font-semibold text-[#64748b]">
          No orders sent yet.
        </div>

        <div className="mt-1 text-[10px] text-[#9ca3af]">
          The PM system remains the
          system of record.
        </div>
      </div>

      {reviewOpen && ticket && (
        <OrderTicketReview
          ticket={ticket}
          warnings={warnings.map(
            (warning) =>
              warning.message
          )}
          pmSystemName={
            pmSystemName
          }
          endpointUrl={
            endpointUrl
          }
          onClose={() =>
            setReviewOpen(false)
          }
        />
      )}
    </section>
  );
}

function OrderTicketReview({
  ticket,
  warnings,
  pmSystemName,
  endpointUrl,
  onClose,
}: {
  ticket: ReturnType<
    typeof buildTicket
  >;

  warnings: string[];

  pmSystemName: string;
  endpointUrl: string;

  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className={titleClass}>
            Review Order Ticket
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="text-[#64748b]"
          >
            ✕
          </button>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <ReviewMetric
            label="Total"
            value={`${ticket.totals.currency} ${ticket.totals.amount.toLocaleString()}`}
          />

          <ReviewMetric
            label="Positions"
            value={String(
              ticket.totals.positions
            )}
          />

          <ReviewMetric
            label="Account"
            value={
              ticket.account.id
            }
          />
        </div>

        {warnings.length > 0 && (
          <div className="mt-4 space-y-2">
            {warnings.map(
              (warning, index) => (
                <div
                  key={index}
                  className={warningClass}
                >
                  {warning}
                </div>
              )
            )}
          </div>
        )}

        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-left text-[11px]">
            <thead>
              <tr className="border-b border-[rgba(0,87,184,.10)]">
                <th className={thClass}>
                  Side
                </th>

                <th className={thClass}>
                  Instrument
                </th>

                <th className={thClass}>
                  Weight
                </th>

                <th className={thClass}>
                  Amount
                </th>
              </tr>
            </thead>

            <tbody>
              {ticket.lines.map(
                (line) => (
                  <tr
                    key={line.lineId}
                    className="border-b border-[rgba(0,87,184,.06)]"
                  >
                    <td className={tdClass}>
                      {line.side}
                    </td>

                    <td className={tdClass}>
                      {line.instrument
                        .ticker ??
                        line.instrument
                          .isin ??
                        line.instrument
                          .valor ??
                        line.instrument
                          .name ??
                        "—"}
                    </td>

                    <td className={tdClass}>
                      {line.weightPct.toFixed(
                        1
                      )}
                      %
                    </td>

                    <td className={tdClass}>
                      {line.currency}{" "}
                      {line.amount.toLocaleString()}
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-5 rounded-lg bg-[#f8faff] p-4 text-[11px] text-[#64748b]">
          Destination:{" "}
          <strong className="text-[#16213e]">
            {pmSystemName ||
              "Not configured"}
          </strong>

          <br />

          Endpoint:{" "}
          <strong className="text-[#16213e]">
            {endpointUrl ||
              "Not configured"}
          </strong>
        </div>

        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className={secondaryButtonClass}
          >
            Cancel
          </button>

          <button
            type="button"
            disabled
            className={disabledSendClass}
          >
            Send order
          </button>
        </div>

        <p className="mt-3 text-right text-[10px] text-[#9ca3af]">
          Sending is disabled until a
          real server-side PM/OMS
          connection is configured.
        </p>
      </div>
    </div>
  );
}

function ReviewMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-[rgba(0,87,184,.08)] bg-[#f8faff] p-3">
      <div className="text-[9px] font-bold uppercase tracking-[0.06em] text-[#64748b]">
        {label}
      </div>

      <div className="mt-1 font-bold text-[#16213e]">
        {value}
      </div>
    </div>
  );
}

const sectionClass =
  "rounded-xl border border-[rgba(0,87,184,.08)] bg-white p-6 shadow-sm";

const titleClass =
  "text-[11px] font-bold uppercase tracking-[0.10em] text-[#64748b]";

const labelClass =
  "mb-1.5 block text-[11px] font-semibold text-[#64748b]";

const inputClass =
  "w-full rounded-lg border-[1.5px] border-[rgba(0,87,184,.14)] bg-white px-3 py-2 text-[13px] font-medium text-[#16213e] outline-none focus:border-[#0057b8]";

const buyButtonClass =
  "rounded-full bg-[#00875a] px-5 py-2.5 text-[12px] font-bold text-white hover:bg-[#00704b] disabled:cursor-not-allowed disabled:opacity-40";

const secondaryButtonClass =
  "mt-5 rounded-full border border-[rgba(0,87,184,.14)] bg-white px-5 py-2 text-[11px] font-semibold text-[#0057b8]";

const disabledSendClass =
  "rounded-full bg-[#0057b8] px-5 py-2 text-[11px] font-semibold text-white opacity-40";

const errorClass =
  "rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-700";

const warningClass =
  "rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-700";

const thClass =
  "px-3 py-2 text-[10px] font-bold uppercase tracking-[0.06em] text-[#64748b]";

const tdClass =
  "px-3 py-3 text-[11px] text-[#64748b]";