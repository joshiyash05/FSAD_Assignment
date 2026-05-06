import { FormEvent, useState } from "react";
import { Button, Card, Field, Message } from "@/components/ui";
import type { SessionState } from "@/hooks/useSession";
import { apiErrorMessage, parkwiseApi } from "@/services/parkwiseApi";
import type { Notify, RegisterRequest } from "@/types/parkwise";

export function LoginPage({
  session,
  push,
  redirect,
  notify,
}: {
  session: SessionState;
  push: (path: string) => void;
  redirect: string;
  notify: Notify;
}) {
  const [isRegistering, setRegistering] = useState(false);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [login, setLogin] = useState({ username: "", password: "" });
  const [register, setRegister] = useState<RegisterRequest>({ username: "", email: "", password: "", first_name: "", last_name: "" });

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = isRegistering ? await parkwiseApi.register(register) : await parkwiseApi.login(login.username, login.password);
      session.persist(response);
      notify({
        severity: "success",
        summary: isRegistering ? "Account created" : "Welcome back",
        detail: isRegistering ? "Welcome to ParkWise." : "Logged in successfully.",
      });
      push(redirect || "/");
    } catch (err) {
      const message = apiErrorMessage(err, isRegistering ? "Registration failed." : "Login failed.");
      setError(message);
      notify({ severity: "error", summary: isRegistering ? "Registration failed" : "Login failed", detail: message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="auth-page">
      <Card className="auth-card">
        <div className="brand-lockup">
          <span className="brand-mark">P</span>
          <h1>ParkWise</h1>
          <p>Reserve smart parking with live availability.</p>
        </div>
        <div className="auth-toggle">
          <Button variant={isRegistering ? "outlined" : "primary"} disabled={isLoading} onClick={() => setRegistering(false)}>Sign in</Button>
          <Button variant={!isRegistering ? "outlined" : "primary"} disabled={isLoading} onClick={() => setRegistering(true)}>Create account</Button>
        </div>
        <form className="form-stack" onSubmit={submit}>
          {isRegistering ? (
            <>
              <div className="responsive-two">
                <Field label="First name" value={register.first_name} onChange={(e) => setRegister({ ...register, first_name: e.target.value })} />
                <Field label="Last name" value={register.last_name} onChange={(e) => setRegister({ ...register, last_name: e.target.value })} />
              </div>
              <Field label="Email" type="email" value={register.email} onChange={(e) => setRegister({ ...register, email: e.target.value })} />
              <Field label="Username" value={register.username} onChange={(e) => setRegister({ ...register, username: e.target.value })} />
              <Field label="Password" type="password" value={register.password} onChange={(e) => setRegister({ ...register, password: e.target.value })} />
            </>
          ) : (
            <>
              <Field label="Username" autoComplete="username" value={login.username} onChange={(e) => setLogin({ ...login, username: e.target.value })} />
              <Field label="Password" type="password" autoComplete="current-password" value={login.password} onChange={(e) => setLogin({ ...login, password: e.target.value })} />
            </>
          )}
          {error ? <Message severity="error">{error}</Message> : null}
          <Button type="submit" disabled={isLoading} className="w-full">{isRegistering ? "Create account" : "Sign in"}</Button>
        </form>
      </Card>
    </section>
  );
}
