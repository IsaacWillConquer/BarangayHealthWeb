import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { changePassword } from "../../api/authLocal";
import { useAuth } from "../../context/useAuth";

const ROLE_HOME = { Admin: "/admin", Staff: "/staff", Resident: "/resident" };

export default function ChangePassword() {
  const [newpass, setNewpass] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!user) {
      navigate("/login");
      return;
    }

    setSaving(true);
    try {
      const res = await changePassword(user.role, user.id, newpass);
      if (!res.success) {
        setError(res.message);
        return;
      }
      navigate(ROLE_HOME[user.role] || "/login");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8F3E9] px-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl border border-[#E7DFCA] bg-white px-8 py-10"
      >
        <h1 className="mb-1.5 text-xl font-extrabold text-[#24322C]">Change Password</h1>
        <p className="mb-5 text-sm text-[#6E7A70]">
          For security, set a new password before continuing.
        </p>

        <label className="mb-1.5 block text-[0.78rem] font-semibold uppercase tracking-wide text-[#6E7A70]">
          New password
        </label>
        <input
          type="password"
          placeholder="At least 7 characters"
          value={newpass}
          onChange={(e) => setNewpass(e.target.value)}
          className="w-full rounded-[9px] border border-[#E7DFCA] bg-[#fbfaf6] px-3.5 py-2.5 text-sm text-[#24322C] focus:border-[#1F7A63] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#E4F1EA]"
        />

        {error && <p className="mt-3 text-sm text-[#C0392B]">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="mt-6 w-full rounded-[10px] bg-[#1F7A63] py-3 text-sm font-bold text-white hover:bg-[#134D3F] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Saving…" : "Update password"}
        </button>
      </form>
    </div>
  );
}
