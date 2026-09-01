"use client";

import { useState } from "react";

export default function SignupRoleFields() {
  const [role, setRole] = useState<"caregiver" | "ngo">("caregiver");

  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="text-sm font-medium">I&apos;m joining as a</p>
        <div className="mt-1 flex gap-2">
          <label
            className={`flex-1 cursor-pointer rounded-xl border px-3 py-2 text-center text-sm font-medium ${
              role === "caregiver" ? "border-primary bg-primary/10 text-primary" : "text-muted"
            }`}
          >
            <input
              type="radio"
              name="role"
              value="caregiver"
              checked={role === "caregiver"}
              onChange={() => setRole("caregiver")}
              className="sr-only"
            />
            🐾 Volunteer
          </label>
          <label
            className={`flex-1 cursor-pointer rounded-xl border px-3 py-2 text-center text-sm font-medium ${
              role === "ngo" ? "border-primary bg-primary/10 text-primary" : "text-muted"
            }`}
          >
            <input
              type="radio"
              name="role"
              value="ngo"
              checked={role === "ngo"}
              onChange={() => setRole("ngo")}
              className="sr-only"
            />
            🏥 NGO
          </label>
        </div>
      </div>

      {role === "ngo" && (
        <input
          name="org_name"
          type="text"
          required
          placeholder="Organisation name"
          className="input"
        />
      )}
    </div>
  );
}
