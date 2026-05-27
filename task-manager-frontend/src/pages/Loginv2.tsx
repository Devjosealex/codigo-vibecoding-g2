import { useState } from 'react';
import { User, Lock } from 'lucide-react';

const row =
  'flex items-center gap-3 border-b-2 border-gray-100 pb-2 pt-1 transition-colors focus-within:border-purple-400';
const inp =
  'min-w-0 flex-1 border-0 bg-transparent py-2 text-[15px] text-neutral-900 outline-none placeholder:text-gray-400';

export function Loginv2() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Login:', { username, password });
  };

  return (
    <div className="relative min-h-dvh w-full overflow-hidden bg-gradient-to-tr from-cyan-300 via-sky-400 to-fuchsia-600 antialiased [-webkit-tap-highlight-color:transparent]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 bottom-10 h-80 w-80 rotate-12 rounded-[2rem] bg-white/15 shadow-inner" />
        <div className="absolute -right-16 top-16 h-72 w-72 -rotate-6 rounded-[2rem] bg-white/10" />
        <div className="absolute left-[15%] top-[35%] h-48 w-48 rotate-[35deg] rounded-3xl bg-white/10" />
        <div className="absolute right-[10%] bottom-[20%] h-36 w-56 -rotate-12 rounded-3xl bg-black/5" />
      </div>

      <div className="relative flex min-h-dvh items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md rounded-2xl bg-white p-10 shadow-2xl ring-1 ring-black/5">
          <h1 className="mb-8 text-center text-3xl font-bold text-neutral-900">Login</h1>

          <form onSubmit={handleSubmit} className="w-full">
            <label className="mb-1 block text-xs font-semibold text-gray-500" htmlFor="lv2-user">
              Username
            </label>
            <div className={row}>
              <User className="h-5 w-5 shrink-0 text-gray-400" aria-hidden />
              <input
                id="lv2-user"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={inp}
                placeholder="Type your username"
              />
            </div>

            <label className="mb-1 mt-8 block text-xs font-semibold text-gray-500" htmlFor="lv2-pass">
              Password
            </label>
            <div className={row}>
              <Lock className="h-5 w-5 shrink-0 text-gray-400" aria-hidden />
              <input
                id="lv2-pass"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inp}
                placeholder="Type your password"
              />
            </div>

            <div className="mt-3 text-right">
              <a href="#" className="text-xs text-gray-400 hover:text-gray-600 hover:underline">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              className="mt-8 w-full rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 py-3 text-sm font-bold uppercase tracking-wide text-white shadow-md transition hover:opacity-90"
            >
              LOGIN
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-gray-500">Or Sign Up Using</p>
          <div className="mt-5 flex justify-center gap-8">
            <a
              href="#"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-[#1877f2] text-white shadow-sm"
              aria-label="Facebook"
            >
              <span className="pb-0.5 font-serif text-xl font-bold leading-none">f</span>
            </a>
            <a
              href="#"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-[#1da1f2] text-white shadow-sm"
              aria-label="Twitter"
            >
              <svg className="h-[18px] w-[18px] fill-current" viewBox="0 0 24 24" aria-hidden>
                <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" />
              </svg>
            </a>
            <a
              href="#"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-[#ea4335] text-white shadow-sm"
              aria-label="Google"
            >
              <span className="text-lg font-bold leading-none">G</span>
            </a>
          </div>

          <div className="mt-8 text-center">
            <p className="text-xs text-gray-500">Or Sign Up Using</p>
            <a href="#" className="mt-2 inline-block text-sm font-bold uppercase tracking-wide text-neutral-900 hover:text-purple-600">
              SIGN UP
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
