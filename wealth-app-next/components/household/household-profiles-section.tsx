"use client";

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

import {
  ageFromDOB,
} from "@/lib/engine/financial-math";

type Props = {
  plan: WealthPlan;
  update: (
    patch: Partial<WealthPlan>
  ) => void;
};

export function HouseholdProfilesSection({
  plan,
  update,
}: Props) {
  const client =
    plan.clients[0];

  if (!client) {
    return (
      <section className="rounded-xl border border-[rgba(0,87,184,.08)] bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.10em] text-[#64748b]">
            Household Profiles
          </h2>

          <div className="h-px flex-1 bg-[rgba(0,87,184,.10)]" />
        </div>

        <p className="text-[12px] text-[#9ca3af]">
          No client added yet.
        </p>
      </section>
    );
  }

  // Calculate the client's current age
  // from their date of birth.
  const age =
    client.dob
      ? ageFromDOB(
          client.dob
        )
      : undefined;

  // Get the selected risk-profile
  // information from constants.ts.
  const riskProfile =
    client.risk
      ? RISK_PROFILES[
          client.risk
        ]
      : undefined;

  // Get the selected time-horizon
  // information from constants.ts.
  const horizonProfile =
    client.horizon
      ? HORIZON_PROFILES[
          client.horizon
        ]
      : undefined;

  // Update only Client 1 while keeping
  // every other client unchanged.
  function updateClient(
    patch: Partial<
      typeof client
    >
  ) {
    update({
      clients:
        plan.clients.map(
          (existingClient) =>
            existingClient.id ===
            client.id
              ? {
                  ...existingClient,
                  ...patch,
                }
              : existingClient
        ),
    });
  }

  return (
    <section className="rounded-xl border border-[rgba(0,87,184,.08)] bg-white p-6 shadow-sm">
      {/* Section heading */}

      <div className="mb-5 flex items-center gap-3">
        <h2 className="text-[11px] font-bold uppercase tracking-[0.10em] text-[#64748b]">
          Household Profiles
        </h2>

        <div className="h-px flex-1 bg-[rgba(0,87,184,.10)]" />
      </div>

      {/* Client summary */}

      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(91,155,213,.3)] bg-[rgba(91,155,213,.15)] text-[12px] font-bold text-[#0057b8]">
          {getInitials(
            client.first,
            client.last
          )}
        </div>

        <div>
          <div className="font-bold text-[#16213e]">
            {getFullName(
              client.first,
              client.last
            )}
          </div>

          <div className="text-[11px] text-[#9ca3af]">
            {getFullName(
              client.first,
              client.last
            )}

            {age != null
              ? ` • age ${age}`
              : ""}
          </div>
        </div>
      </div>

      {/* Basic information */}

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className={labelClass}>
            First name
          </label>

          <input
            className={inputClass}
            value={
              client.first ?? ""
            }
            onChange={(e) =>
              updateClient({
                first:
                  e.target.value,
              })
            }
          />
        </div>

        <div>
          <label className={labelClass}>
            Last name
          </label>

          <input
            className={inputClass}
            value={
              client.last ?? ""
            }
            onChange={(e) =>
              updateClient({
                last:
                  e.target.value,
              })
            }
          />
        </div>

        <div>
          <label className={labelClass}>
            Date of birth
          </label>

          <input
            type="date"
            className={inputClass}
            value={
              client.dob ?? ""
            }
            onChange={(e) =>
              updateClient({
                dob:
                  e.target.value,
              })
            }
          />
        </div>
      </div>

      {/* Location */}

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <div>
          <label className={labelClass}>
            City
          </label>

          <input
            className={inputClass}
            value={
              client.city ?? ""
            }
            onChange={(e) =>
              updateClient({
                city:
                  e.target.value,
              })
            }
          />
        </div>

        <div>
          <label className={labelClass}>
            State / Province / Canton
          </label>

          {client.country === "US" ? (
            <select
              className={inputClass}
              value={
                client.state ?? ""
              }
              onChange={(e) =>
                updateClient({
                  state:
                    e.target.value,
                })
              }
            >
              <option value="">
                — Select —
              </option>

              {Object.entries(
                US_STATE_TAX_RATES
              ).map(
                ([
                  state,
                  rate,
                ]) => (
                  <option
                    key={state}
                    value={state}
                  >
                    {state} (
                    {rate.toFixed(2)}
                    %)
                  </option>
                )
              )}
            </select>
          ) : (
            <input
              className={inputClass}
              value={
                client.state ?? ""
              }
              onChange={(e) =>
                updateClient({
                  state:
                    e.target.value,
                })
              }
            />
          )}
        </div>

        <div>
          <label className={labelClass}>
            Country
          </label>

          <select
            className={inputClass}
            value={
              client.country ?? ""
            }
            onChange={(e) =>
              updateClient({
                country:
                  e.target
                    .value as CountryCode,
              })
            }
          >
            <option value="">
              — Select —
            </option>

            {Object.entries(
              COUNTRY_LABELS
            ).map(
              ([
                code,
                label,
              ]) => (
                <option
                  key={code}
                  value={code}
                >
                  {countryFlag(
                    code
                  )}{" "}
                  {label}
                </option>
              )
            )}
          </select>
        </div>
      </div>

      {/* Risk profile */}

      <div className="mt-5">
        <label className={labelClass}>
          Risk tolerance
        </label>

        <select
          className={inputClass}
          value={
            client.risk ?? ""
          }
          onChange={(e) =>
            updateClient({
              risk:
                e.target
                  .value as RiskProfile,
            })
          }
        >
          <option value="">
            — Select —
          </option>

          {Object.entries(
            RISK_PROFILES
          ).map(
            ([
              value,
              profile,
            ]) => (
              <option
                key={value}
                value={value}
              >
                {profile.label}
              </option>
            )
          )}
        </select>

        {riskProfile && (
          <div className="mt-4 rounded-xl border border-[rgba(0,87,184,.08)] bg-[#f8faff] p-4">
            <div className="text-[12px] text-[#64748b]">
              Risk Profile
            </div>

            <div className="mt-1 text-[13px] font-semibold text-[#16213e]">
              {riskProfile.label}
              {" • "}
              μ {riskProfile.mu}%
              {" "}
              σ {riskProfile.sigma}%
            </div>

            <p className="mt-1 text-[11px] leading-5 text-[#9ca3af]">
              {riskProfile.note}
            </p>
          </div>
        )}
      </div>

      {/* Time horizon */}

      <div className="mt-5">
        <label className={labelClass}>
          Time horizon
        </label>

        <select
          className={inputClass}
          value={
            client.horizon ?? ""
          }
          onChange={(e) =>
            updateClient({
              horizon:
                e.target
                  .value as TimeHorizon,
            })
          }
        >
          <option value="">
            — Select —
          </option>

          {Object.entries(
            HORIZON_PROFILES
          ).map(
            ([
              value,
              profile,
            ]) => (
              <option
                key={value}
                value={value}
              >
                {profile.label}
              </option>
            )
          )}
        </select>

        {horizonProfile && (
          <div className="mt-4 rounded-xl border border-[rgba(0,87,184,.08)] bg-[#f8faff] p-4">
            <div className="text-[12px] text-[#64748b]">
              Time horizon
            </div>

            <div className="mt-1 text-[13px] font-semibold text-[#16213e]">
              {horizonProfile.label}
            </div>

            <p className="mt-1 text-[11px] leading-5 text-[#9ca3af]">
              {horizonProfile.note}
            </p>
          </div>
        )}
      </div>

      {/* Additional client */}

      <div className="mt-5 border-t border-[rgba(0,87,184,.08)] pt-5">
        <button
          type="button"
          className="rounded-lg border border-[rgba(0,87,184,.14)] bg-white px-4 py-2 text-[12px] font-semibold text-[#0057b8] transition hover:bg-[#f8faff]"
        >
          + Add Client 2
        </button>
      </div>
    </section>
  );
}

// Build the client's full display name.
function getFullName(
  first?: string,
  last?: string
): string {
  const fullName =
    [
      first,
      last,
    ]
      .filter(Boolean)
      .join(" ");

  return (
    fullName ||
    "Unnamed client"
  );
}

// Build initials for the client avatar.
function getInitials(
  first?: string,
  last?: string
): string {
  const initials =
    `${
      first?.[0] ?? ""
    }${
      last?.[0] ?? ""
    }`.toUpperCase();

  return initials || "?";
}

// Country emoji used in the country select.
function countryFlag(
  code: string
): string {
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

// Same field styles used by the other migrated sections.
const labelClass =
  "mb-1.5 block text-[11px] font-semibold text-[#64748b]";

const inputClass =
  "w-full rounded-lg border-[1.5px] border-[rgba(0,87,184,.14)] bg-white px-3 py-2 text-[13px] font-medium text-[#16213e] outline-none focus:border-[#0057b8] focus:ring-2 focus:ring-[rgba(0,87,184,.08)]";