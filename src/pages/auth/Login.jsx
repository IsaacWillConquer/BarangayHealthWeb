import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../../api/authLocal";
import { useAuth } from "../../context/useAuth";

const ROLE_HOME = { Admin: "/admin", Staff: "/staff", Resident: "/resident" };

export default function Login() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { setUser } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!identifier.trim() || !password.trim()) {
      setError("Please fill in both fields.");
      return;
    }

    setLoading(true);
    try {
      const res = await login(identifier.trim(), password.trim());

      if (!res.success) {
        setError(res.message || "Login failed.");
        return;
      }

      setUser({ role: res.role, id: res.id, firstName: res.firstName });

      if (res.mustChangePassword) {
        navigate("/change-password");
      } else {
        navigate(ROLE_HOME[res.role] || "/login");
      }
    } catch {
      setError("Couldn't reach Firestore. Check your connection and .env setup.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {}
      <aside
        className="relative flex flex-none flex-col justify-between overflow-hidden px-7 py-10 text-[#f4f1e6] md:flex-[0_0_42%] md:px-13 md:py-14"
        style={{
          background:
            "radial-gradient(circle at 18% 8%, rgba(219,154,52,0.16) 0%, rgba(219,154,52,0) 40%), linear-gradient(170deg, #0F332C 0%, #164A3F 48%, #1E6353 100%)",
        }}
      >
        {}
        <div
          className="pointer-events-none absolute inset-0 opacity-90"
          style={{
            backgroundImage: "radial-gradient(rgba(244,241,230,0.14) 1.5px, transparent 1.5px)",
            backgroundSize: "22px 22px",
            maskImage: "radial-gradient(circle at 20% 15%, #000 0%, transparent 65%)",
            WebkitMaskImage: "radial-gradient(circle at 20% 15%, #000 0%, transparent 65%)",
          }}
        />
        {}
        <div
          className="pointer-events-none absolute -bottom-32 -right-32 h-90 w-90 rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(219,154,52,0.32) 0%, rgba(219,154,52,0) 70%)",
          }}
        />

        <div className="relative z-10">
          <div className="mb-7 flex h-13 w-13 items-center justify-center rounded-2xl border border-[#f4f1e6]/35 bg-[#f4f1e6]/14">
            <svg viewBox="0 0 24 24" fill="none" className="h-6.5 w-6.5">
              <path
                d="M12 21s-7.5-4.6-10-9.2C.4 8.1 2.2 4.5 5.7 4c2-.3 3.7.6 4.9 2.1L12 7.6l1.4-1.5C14.6 4.6 16.3 3.7 18.3 4c3.5.5 5.3 4.1 3.7 7.8C19.5 16.4 12 21 12 21Z"
                stroke="#f4f1e6"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
              <path d="M12 9v6M9 12h6" stroke="#f4f1e6" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </div>

          <p className="mb-3.5 text-xs font-semibold uppercase tracking-[0.12em] text-[#FBEEDA]">
            Barangay Health Portal
          </p>
          <h1 className="mb-4 max-w-[9.5em] text-3xl font-extrabold leading-[1.18] tracking-tight sm:text-4xl">
            Health services for our community
          </h1>
          <p className="max-w-[30em] text-base leading-relaxed text-[#f4f1e6]/82">
            Surveys, health events, and resident records, gathered together so the barangay can
            act on what matters to its people.
          </p>
        </div>

        <ul className="relative z-10 mt-10 flex flex-col gap-4">
          {[
            "Share feedback that shapes local health programs",
            "Track surveys assigned to your household",
            "Staff can monitor response rates in real time",
          ].map((text) => (
            <li key={text} className="flex items-start gap-3 text-sm text-[#f4f1e6]/88">
              <span className="mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[#DB9A34]/90">
                <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3">
                  <path
                    d="M5 12l5 5L19 7"
                    stroke="#fff"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <span>{text}</span>
            </li>
          ))}
        </ul>

        <p className="relative z-10 text-xs text-[#f4f1e6]/55">
          A digital initiative of your local health center
        </p>
      </aside>

      {}
      <main className="flex flex-1 flex-col items-center justify-center bg-[#F8F3E9] px-6 py-10">
        <form
          onSubmit={handleSubmit}
          className="animate-rise-in w-full max-w-[488px] rounded-[20px] border border-[#E7DFCA] bg-white px-8 py-10 sm:px-11 sm:py-12"
          style={{
            boxShadow:
              "0 28px 60px -22px rgba(35,74,56,0.38), 0 6px 16px rgba(35,74,56,0.1)",
          }}
        >
          <h3 className="mb-1.5 text-[1.75rem] font-extrabold tracking-tight text-[#24322C]">
            Sign in
          </h3>
          <p className="mb-5 border-b border-[#E7DFCA] pb-4.5 text-[0.83rem] leading-relaxed text-[#6E7A70]">
            Residents: use your Resident Number as both username and password (until you change
            it).
          </p>

          <label className="mb-1.5 block text-[0.78rem] font-semibold uppercase tracking-wide text-[#6E7A70]">
            Resident Number / Email
          </label>
          <input
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="Resident Number or Email"
            autoComplete="username"
            className="w-full rounded-[9px] border border-[#E7DFCA] bg-[#fbfaf6] px-3.5 py-2.5 text-[0.94rem] text-[#24322C] transition-colors duration-150 placeholder:text-[#a8a292] focus:border-[#1F7A63] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#E4F1EA]"
          />

          <label className="mb-1.5 mt-4 block text-[0.78rem] font-semibold uppercase tracking-wide text-[#6E7A70]">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoComplete="current-password"
              className="w-full rounded-[9px] border border-[#E7DFCA] bg-[#fbfaf6] px-3.5 py-2.5 pr-11 text-[0.94rem] text-[#24322C] transition-colors duration-150 placeholder:text-[#a8a292] focus:border-[#1F7A63] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#E4F1EA]"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-[#6E7A70] transition-colors duration-150 hover:text-[#24322C]"
            >
              {showPassword ? (
                <svg viewBox="0 0 24 24" fill="none" className="h-[19px] w-[19px]">
                  <path d="M3 3l18 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                  <path
                    d="M10.6 5.1c.45-.07.92-.1 1.4-.1 7 0 10.5 7 10.5 7-.6 1.2-1.6 2.7-3 4M6.6 6.6C3.6 8.4 1.5 12 1.5 12s3.5 7 10.5 7c1.6 0 3-.35 4.2-.9"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M9.9 9.9a3 3 0 0 0 4.2 4.2"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" className="h-[19px] w-[19px]">
                  <path
                    d="M1.5 12S5 5 12 5s10.5 7 10.5 7-3.5 7-10.5 7S1.5 12 1.5 12Z"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinejoin="round"
                  />
                  <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
                </svg>
              )}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-6.5 w-full rounded-[10px] bg-[#1F7A63] py-3.5 text-base font-bold tracking-wide text-white transition-colors duration-150 hover:bg-[#134D3F] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Login"}
          </button>

          {error && <p className="mt-3 min-h-[18px] text-[0.83rem] text-[#C0392B]">{error}</p>}

          <p className="mt-4.5 text-center text-[0.78rem] text-[#6E7A70]">
            Trouble logging in? Contact your barangay health center office.
          </p>
          <p className="mt-3.5 rounded-lg border border-[#E7DFCA] bg-[#E4F1EA] px-3 py-2.5 text-[0.76rem] leading-relaxed text-[#6E7A70]">
            New resident accounts are created only by Barangay Health Center staff. If you're a
            resident without an account yet, please visit the health center in person.
          </p>
        </form>

        <p className="mt-5.5 text-center text-[0.78rem] text-[#a49e8c]">
          <a href="#" className="text-[#1F7A63] hover:underline">
            About this portal
          </a>{" "}
          &nbsp;&middot;&nbsp; &copy; {new Date().getFullYear()} Barangay Health Portal
        </p>
      </main>
    </div>
  );
}
