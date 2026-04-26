import { useState, type FormEvent } from "react";

type AuthMode = "login" | "register";

type AuthScreenProps = {
  apiStatus: string;
  loading: boolean;
  mode: AuthMode;
  message: string | null;
  onSubmit: (payload: { name?: string; email: string; password: string }) => Promise<void>;
  onSwitchMode: (mode: AuthMode) => void;
};

export function AuthScreen({
  apiStatus,
  loading,
  mode,
  message,
  onSubmit,
  onSwitchMode,
}: AuthScreenProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit({
      name: mode === "register" ? name : undefined,
      email,
      password,
    });
  }

  return (
    <div className="auth-shell">
      <div className="auth-hero">
        <div className="brand-block">
          <div className="brand-mark">
            <img src="/logoCC.png" alt="Logo Cuentas Claras" />
          </div>
          <div>
            <p className="brand-kicker">Cuentas Claras</p>
            <h1>Tu declaracion, sin complicaciones</h1>
          </div>
        </div>
        <p className="auth-copy">
          Registra tus movimientos, organiza soportes y revisa tu expediente en un
          flujo real por usuario.
        </p>
        <p className="api-inline">{apiStatus}</p>
      </div>

      <div className="auth-card">
        <div className="card-heading">
          <div>
            <span className="section-tag">Acceso real</span>
            <h3>{mode === "login" ? "Iniciar sesion" : "Crear cuenta"}</h3>
          </div>
        </div>

        <div className="segmented-control auth-tabs" role="tablist" aria-label="Tipo de acceso">
          <button
            type="button"
            className={mode === "login" ? "active" : ""}
            onClick={() => onSwitchMode("login")}
          >
            Iniciar sesion
          </button>
          <button
            type="button"
            className={mode === "register" ? "active" : ""}
            onClick={() => onSwitchMode("register")}
          >
            Crear cuenta
          </button>
        </div>

        <form className="movement-form auth-form" onSubmit={handleSubmit}>
          {mode === "register" ? (
            <label className="field-stack">
              <span>Nombre</span>
              <input
                required
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Tu nombre completo"
              />
            </label>
          ) : null}

          <label className="field-stack">
            <span>Correo</span>
            <input
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="tu@correo.com"
            />
          </label>

          <label className="field-stack">
            <span>Contrasena</span>
            <input
              required
              minLength={8}
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Minimo 8 caracteres"
            />
          </label>

          <button type="submit" className="primary-submit" disabled={loading}>
            {loading
              ? "Procesando..."
              : mode === "login"
                ? "Entrar"
                : "Crear cuenta"}
          </button>
        </form>

        {message ? <p className="form-feedback">{message}</p> : null}
      </div>
    </div>
  );
}
