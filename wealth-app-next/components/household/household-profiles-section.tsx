"use client";

import { useState } from "react";

import type {
  CountryCode,
  RiskProfile,
  TimeHorizon,
  WealthPlan,
} from "@/lib/engine/types";

import {
  COUNTRY_LABELS,
  HORIZON_PROFILES,
  RISK_PROFILES,
  US_STATE_TAX_RATES,
} from "@/lib/engine/constants";

import { ageFromDOB } from "@/lib/engine/financial-math";

type Props = {
  plan: WealthPlan;
  update: (patch: Partial<WealthPlan>) => void;
};

type ClientType = WealthPlan["clients"][number];
type ChildType = WealthPlan["children"][number];

export function HouseholdProfilesSection({ plan, update }: Props) {
  if (plan.clients.length === 0) {
    return (
      <section className="rounded-xl border border-[rgba(0,87,184,.08)] bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.10em] text-[#64748b]">
            Household Profiles
          </h2>

          <div className="h-px flex-1 bg-[rgba(0,87,184,.10)]" />
        </div>

        <p className="text-[12px] text-[#9ca3af]">No client added yet.</p>
      </section>
    );
  }

  function updateClient(clientId: string, patch: Partial<ClientType>) {
    update({
      clients: plan.clients.map(
        (client) =>
          client.id === clientId
            ? {
                ...client,
                ...patch,
              }
            : client, // client ID doesn't match the client we're updating
      ),
    });
  }

  function addClient2() {
    if (plan.clients.length >= 2) {
      return;
    }

    const primary = plan.clients[0];

    const newClient: ClientType = {
      id: crypto.randomUUID(),
      first: "",
      last: "",
      dob: "",
      city: "",
      state: "",
      country: primary?.country,
      risk: primary?.risk,
      horizon: primary?.horizon,
    };

    update({
      clients: [...plan.clients, newClient],
    });
  }

  function removeClient(clientId: string) {
    if (plan.clients.length <= 1) {
      return;
    }

    update({
      clients: plan.clients.filter((client) => client.id !== clientId),
    });
  }

  function addChild() {
    const newChild: ChildType = {
      id: crypto.randomUUID(),
      first: "",
      last: "",
      dob: "",
    };

    update({
      children: [...plan.children, newChild],
    });
  }

  function updateChild(childId: string, patch: Partial<ChildType>) {
    update({
      children: plan.children.map((child) =>
        child.id === childId
          ? {
              ...child,
              ...patch,
            }
          : child,
      ),
    });
  }

  function removeChild(childId: string) {
    update({
      children: plan.children.filter((child) => child.id !== childId),
    });
  }

  return (
    <section className="rounded-xl border border-[rgba(0,87,184,.08)] bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <h2 className="text-[11px] font-bold uppercase tracking-[0.10em] text-[#64748b]">
          Household Profiles
        </h2>

        <div className="h-px flex-1 bg-[rgba(0,87,184,.10)]" />
      </div>

      <div
        className={`grid gap-6 ${
          plan.clients.length === 2 ? "lg:grid-cols-2" : "grid-cols-1"
        }`}
      >
        {plan.clients.map((client, index) => (
          <ClientProfile
            key={client.id}
            client={client}
            index={index}
            updateClient={updateClient}
            onRemove={() => removeClient(client.id)}
            canRemove={index > 0}
          />
        ))}
      </div>

      {plan.clients.length < 2 && (
        <div className="mt-6 border-t border-[rgba(0,87,184,.08)] pt-5">
          <button
            type="button"
            onClick={addClient2}
            className="rounded-lg border border-[rgba(0,87,184,.14)] bg-white px-4 py-2 text-[12px] font-semibold text-[#0057b8] transition hover:bg-[#f8faff]"
          >
            + Add Client 2
          </button>
        </div>
      )}

      <div className="mt-8 border-t border-[rgba(0,87,184,.10)] pt-6">
        <div className="mb-5 flex items-center gap-3">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.10em] text-[#64748b]">
            Children
          </h3>

          <div className="h-px flex-1 bg-[rgba(0,87,184,.10)]" />
        </div>

        {plan.children.length === 0 ? (
          <p className="text-[12px] text-[#9ca3af]">No children added.</p>
        ) : (
          <div className="space-y-5">
            {plan.children.map((child, index) => (
              <ChildProfile
                key={child.id}
                child={child}
                index={index}
                updateChild={updateChild}
                onRemove={() => removeChild(child.id)}
              />
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={addChild}
          className="mt-5 rounded-lg border border-[rgba(0,87,184,.14)] bg-white px-4 py-2 text-[12px] font-semibold text-[#0057b8] transition hover:bg-[#f8faff]"
        >
          + Add Child
        </button>
      </div>
    </section>
  );
}

// Renders the entire form for one client, including their fields
function ClientProfile({
  client,
  index,
  updateClient,
  onRemove,
  canRemove,
}: {
  client: ClientType;
  index: number;
  updateClient: (clientId: string, patch: Partial<ClientType>) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const [collapsed, setCollapsed] = useState(false);

  const age = client.dob ? ageFromDOB(client.dob) : undefined;

  const riskProfile = client.risk ? RISK_PROFILES[client.risk] : undefined;

  const horizonProfile = client.horizon
    ? HORIZON_PROFILES[client.horizon]
    : undefined;

  return (
    <div className="rounded-xl border border-[rgba(0,87,184,.08)] bg-[#f8faff] p-5">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(91,155,213,.3)] bg-[rgba(91,155,213,.15)] text-[12px] font-bold text-[#0057b8]">
            {getInitials(client.first, client.last)}
          </div>

          <div>
            <div className="font-bold text-[#16213e]">
              {getFullName(client.first, client.last)}
            </div>

            <div className="text-[11px] text-[#9ca3af]">
              {index === 0 ? "Client 1" : `Client ${index + 1}`}
              {age != null ? ` • age ${age}` : ""}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setCollapsed((prev) => !prev)}
            className="text-[11px] font-semibold text-[#0057b8] transition hover:text-[#004494]"
          >
            {collapsed ? "Expand" : "Collapse"}
          </button>

          {canRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="text-[11px] font-semibold text-red-500 transition hover:text-red-600"
            >
              Remove client
            </button>
          )}
        </div>
      </div>

      {!collapsed && (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className={labelClass}>First name</label>

              <input
                className={inputClass}
                value={client.first ?? ""}
                onChange={(e) =>
                  updateClient(client.id, {
                    first: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <label className={labelClass}>Last name</label>

              <input
                className={inputClass}
                value={client.last ?? ""}
                onChange={(e) =>
                  updateClient(client.id, {
                    last: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <label className={labelClass}>Date of birth</label>

              <input
                type="date"
                className={inputClass}
                value={client.dob ?? ""}
                onChange={(e) =>
                  updateClient(client.id, {
                    dob: e.target.value,
                  })
                }
              />
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div>
              <label className={labelClass}>City</label>

              <input
                className={inputClass}
                value={client.city ?? ""}
                onChange={(e) =>
                  updateClient(client.id, {
                    city: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <label className={labelClass}>State / Province / Canton</label>

              {client.country === "US" ? (
                <select
                  className={inputClass}
                  value={client.state ?? ""}
                  onChange={(e) =>
                    updateClient(client.id, {
                      state: e.target.value,
                    })
                  }
                >
                  <option value="">— Select —</option>

                  {Object.entries(US_STATE_TAX_RATES).map(([state, rate]) => (
                    <option key={state} value={state}>
                      {state} ({rate.toFixed(2)}%)
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  className={inputClass}
                  value={client.state ?? ""}
                  onChange={(e) =>
                    updateClient(client.id, {
                      state: e.target.value,
                    })
                  }
                />
              )}
            </div>

            <div>
              <label className={labelClass}>Country</label>

              <select
                className={inputClass}
                value={client.country ?? ""}
                onChange={(e) =>
                  updateClient(client.id, {
                    country: e.target.value as CountryCode,
                  })
                }
              >
                <option value="">— Select —</option>

                {Object.entries(COUNTRY_LABELS).map(([code, label]) => (
                  <option key={code} value={code}>
                    {countryFlag(code)} {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-5">
            <label className={labelClass}>Risk tolerance</label>

            <select
              className={inputClass}
              value={client.risk ?? ""}
              onChange={(e) =>
                updateClient(client.id, {
                  risk: e.target.value as RiskProfile,
                })
              }
            >
              <option value="">— Select —</option>

              {/* {Object.entries(RISK_PROFILES).map(([value, profile]) => (
            <option key={value} value={value}>
              {profile.label}
            </option>
          ))} */}
              {Object.entries(RISK_PROFILES)
                .filter(
                  ([value]) =>
                    value !== "very_conservative" &&
                    value !== "very_aggressive",
                )
                .map(([value, profile]) => (
                  <option key={value} value={value}>
                    {profile.label}
                  </option>
                ))}
            </select>

            {riskProfile && (
              <div className="mt-4 rounded-xl border border-[rgba(0,87,184,.08)] bg-[#f8faff] p-4">
                <div className="text-[12px] text-[#64748b]">Risk Profile</div>

                <div className="mt-1 text-[13px] font-semibold text-[#16213e]">
                  {riskProfile.label}
                  {" • "}μ {riskProfile.mu}% σ {riskProfile.sigma}%
                </div>

                <p className="mt-1 text-[11px] leading-5 text-[#9ca3af]">
                  {riskProfile.note}
                </p>
              </div>
            )}
          </div>

          <div className="mt-5">
            <label className={labelClass}>Time horizon</label>

            <select
              className={inputClass}
              value={client.horizon ?? ""}
              onChange={(e) =>
                updateClient(client.id, {
                  horizon: e.target.value as TimeHorizon,
                })
              }
            >
              <option value="">— Select —</option>

              {Object.entries(HORIZON_PROFILES).map(([value, profile]) => (
                <option key={value} value={value}>
                  {profile.label}
                </option>
              ))}
            </select>

            {horizonProfile && (
              <div className="mt-4 rounded-xl border border-[rgba(0,87,184,.08)] bg-[#f8faff] p-4">
                <div className="text-[12px] text-[#64748b]">Time horizon</div>

                <div className="mt-1 text-[13px] font-semibold text-[#16213e]">
                  {horizonProfile.label}
                </div>

                <p className="mt-1 text-[11px] leading-5 text-[#9ca3af]">
                  {horizonProfile.note}
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function ChildProfile({
  child,
  index,
  updateChild,
  onRemove,
}: {
  child: ChildType;
  index: number;
  updateChild: (childId: string, patch: Partial<ChildType>) => void;
  onRemove: () => void;
}) {
  const age = child.dob ? ageFromDOB(child.dob) : undefined;

  return (
    <div className="rounded-xl border border-[rgba(0,87,184,.08)] bg-[#f8faff] p-5">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(91,155,213,.3)] bg-[rgba(91,155,213,.15)] text-[11px] font-bold text-[#0057b8]">
            {getInitials(child.first, child.last)}
          </div>

          <div>
            <div className="text-[13px] font-bold text-[#16213e]">
              {getFullName(child.first, child.last)}
            </div>

            <div className="text-[10px] text-[#9ca3af]">
              Child {index + 1}
              {age != null ? ` • age ${age}` : ""}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onRemove}
          className="text-[11px] font-semibold text-red-500 transition hover:text-red-600"
        >
          Remove
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className={labelClass}>First name</label>

          <input
            className={inputClass}
            value={child.first ?? ""}
            onChange={(e) =>
              updateChild(child.id, {
                first: e.target.value,
              })
            }
          />
        </div>

        <div>
          <label className={labelClass}>Last name</label>

          <input
            className={inputClass}
            value={child.last ?? ""}
            onChange={(e) =>
              updateChild(child.id, {
                last: e.target.value,
              })
            }
          />
        </div>

        <div>
          <label className={labelClass}>Date of birth</label>

          <input
            type="date"
            className={inputClass}
            value={child.dob ?? ""}
            onChange={(e) =>
              updateChild(child.id, {
                dob: e.target.value,
              })
            }
          />
        </div>
      </div>
    </div>
  );
}

function getFullName(first?: string, last?: string): string {
  const fullName = [first, last].filter(Boolean).join(" ");

  return fullName || "Unnamed client";
}

function getInitials(first?: string, last?: string): string {
  const initials = `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase();

  return initials || "?";
}

function countryFlag(code: string): string {
  switch (code) {
    case "US":
      return "🇺🇸";

    case "CA":
      return "🇨🇦";

    case "GB":
      return "🇬🇧";

    case "CH":
      return "🇨🇭";

    case "AU":
      return "🇦🇺";

    case "DE":
      return "🇩🇪";

    case "FR":
      return "🇫🇷";

    case "IT":
      return "🇮🇹";

    case "ES":
      return "🇪🇸";

    case "JP":
      return "🇯🇵";

    default:
      return "🌐";
  }
}

const labelClass = "mb-1.5 block text-[11px] font-semibold text-[#64748b]";

const inputClass =
  "w-full rounded-lg border-[1.5px] border-[rgba(0,87,184,.14)] bg-white px-3 py-2 text-[13px] font-medium text-[#16213e] outline-none focus:border-[#0057b8] focus:ring-2 focus:ring-[rgba(0,87,184,.08)]";
