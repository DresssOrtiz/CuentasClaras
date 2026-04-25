import { useEffect, useMemo, useState } from "react";

import { MetricCard, PanelCard, StatusPill } from "./components/ui";
import {
  aiHighlights,
  categoryStats,
  historyItems,
  monthlyBars,
  profileSections,
  quickActions,
  summaryMetrics,
  taxChecklist,
} from "./data/mockData";

type HealthResponse = {
  message: string;
  service: string;
  status: string;
};

type ViewId = "inicio" | "historial" | "estadisticas" | "perfil" | "reporte-ia";

type NavItem = {
  id: ViewId;
  label: string;
  icon: string;
};

const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

const navItems: NavItem[] = [
  { id: "inicio", label: "Inicio", icon: "Inicio" },
  { id: "historial", label: "Historial", icon: "Movs" },
  { id: "estadisticas", label: "Estadisticas", icon: "Stats" },
  { id: "perfil", label: "Perfil", icon: "Perfil" },
  { id: "reporte-ia", label: "Reporte IA", icon: "IA" },
];

export default function App() {
  const [activeView, setActiveView] = useState<ViewId>("inicio");
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const response = await fetch(`${apiUrl}/health`);

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const payload = (await response.json()) as HealthResponse;
        setHealth(payload);
      } catch (requestError) {
        const message =
          requestError instanceof Error
            ? requestError.message
            : "Unknown error while connecting to the API";

        setError(message);
      }
    };

    void fetchHealth();
  }, []);

  const apiStatus = useMemo(() => {
    if (health) {
      return `API conectada: ${health.message}`;
    }

    if (error) {
      return `API no disponible: ${error}`;
    }

    return "Verificando API...";
  }, [error, health]);

  return (
    <div className="application-frame">
      <aside className="sidebar">
        <div className="brand-block">
          <div className="brand-mark">
            <img src="/logoCC.png" alt="Logo Cuentas Claras" />
          </div>
          <div>
            <p className="brand-kicker">Cuentas Claras</p>
            <h1>Tu declaracion, sin complicaciones</h1>
          </div>
        </div>

        <nav className="nav-stack" aria-label="Navegacion principal">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`nav-button ${activeView === item.id ? "active" : ""}`}
              onClick={() => setActiveView(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <PanelCard className="sidebar-support">
          <span className="section-tag">Acompanamiento</span>
          <h3>Progreso general al dia</h3>
          <p>
            Tus movimientos y soportes estan organizados para que el siguiente
            paso sea revisar consistencias.
          </p>
          <div className="progress-track" aria-hidden="true">
            <span style={{ width: "72%" }} />
          </div>
          <small>72% del borrador tributario preparado</small>
        </PanelCard>
      </aside>

      <main className="main-shell">
        <header className="topbar">
          <div>
            <p className="section-tag">Vista actual</p>
            <h2>{getViewTitle(activeView)}</h2>
          </div>
          <div className="topbar-meta">
            <StatusPill tone={health ? "success" : error ? "danger" : "info"}>
              {health ? health.status.toUpperCase() : error ? "ERROR" : "SYNC"}
            </StatusPill>
            <span className="api-inline">{apiStatus}</span>
          </div>
        </header>

        <section className="content-shell">{renderView(activeView, apiStatus)}</section>
      </main>

      <nav className="mobile-nav" aria-label="Navegacion movil">
        {navItems.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`mobile-nav-button ${activeView === item.id ? "active" : ""}`}
            onClick={() => setActiveView(item.id)}
          >
            <span>{item.icon}</span>
            <small>{item.label}</small>
          </button>
        ))}
      </nav>
    </div>
  );
}

function getViewTitle(view: ViewId): string {
  switch (view) {
    case "inicio":
      return "Inicio";
    case "historial":
      return "Historial";
    case "estadisticas":
      return "Estadisticas";
    case "perfil":
      return "Perfil";
    case "reporte-ia":
      return "Reporte IA";
    default:
      return "Inicio";
  }
}

function renderView(view: ViewId, apiStatus: string) {
  switch (view) {
    case "inicio":
      return <HomeView apiStatus={apiStatus} />;
    case "historial":
      return <HistoryView />;
    case "estadisticas":
      return <StatisticsView />;
    case "perfil":
      return <ProfileView />;
    case "reporte-ia":
      return <AiReportView />;
    default:
      return <HomeView apiStatus={apiStatus} />;
  }
}

function HomeView({ apiStatus }: { apiStatus: string }) {
  return (
    <div className="view-grid">
      <section className="hero-banner">
        <div>
          <p className="section-tag">Panel principal</p>
          <h3>Proyecto base en construccion con identidad visual activa</h3>
          <p>
            Revisa tu panorama general, registra movimientos y prepara un
            resumen ordenado antes de pasar a validaciones mas profundas.
          </p>
        </div>
        <div className="hero-aside">
          <StatusPill tone="success">Al dia</StatusPill>
          <span className="due-chip">Siguiente corte: 15 Oct</span>
        </div>
      </section>

      <div className="metrics-grid">
        {summaryMetrics.map((metric) => (
          <MetricCard
            key={metric.label}
            label={metric.label}
            value={metric.value}
            detail={metric.detail}
            tone={metric.tone}
          />
        ))}
      </div>

      <div className="dual-grid">
        <PanelCard>
          <div className="card-heading">
            <div>
              <span className="section-tag">Acciones</span>
              <h3>Accesos rapidos</h3>
            </div>
          </div>
          <div className="quick-actions">
            {quickActions.map((action) => (
              <button key={action.title} type="button" className="action-card">
                <strong>{action.title}</strong>
                <span>{action.description}</span>
              </button>
            ))}
          </div>
        </PanelCard>

        <PanelCard>
          <div className="card-heading">
            <div>
              <span className="section-tag">Estado general</span>
              <h3>Recordatorio y soporte</h3>
            </div>
          </div>
          <div className="support-note">
            <p>
              Vas bien. Este mes ya registraste ingresos, gastos y soportes
              clave. El siguiente foco es revisar dos movimientos pendientes.
            </p>
            <ul className="mini-list">
              <li>Factura de servicios profesionales por confirmar.</li>
              <li>Comprobante de salud pendiente de adjuntar.</li>
              <li>{apiStatus}</li>
            </ul>
          </div>
        </PanelCard>
      </div>

      <div className="dual-grid">
        <PanelCard>
          <div className="card-heading">
            <div>
              <span className="section-tag">Actividad mensual</span>
              <h3>Resumen visual del mes</h3>
            </div>
          </div>
          <div className="bar-chart">
            {monthlyBars.map((bar) => (
              <div key={bar.label} className="bar-group">
                <div
                  className={`bar ${bar.tone}`}
                  style={{ height: `${bar.value}%` }}
                />
                <span>{bar.label}</span>
              </div>
            ))}
          </div>
        </PanelCard>

        <PanelCard>
          <div className="card-heading">
            <div>
              <span className="section-tag">Checklist</span>
              <h3>Seguimiento inmediato</h3>
            </div>
          </div>
          <div className="checklist">
            {taxChecklist.map((item) => (
              <div key={item.title} className="check-item">
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.description}</p>
                </div>
                <StatusPill tone={item.done ? "success" : "warning"}>
                  {item.done ? "Listo" : "Pendiente"}
                </StatusPill>
              </div>
            ))}
          </div>
        </PanelCard>
      </div>
    </div>
  );
}

function HistoryView() {
  return (
    <div className="stack-layout">
      <PanelCard>
        <div className="card-heading">
          <div>
            <span className="section-tag">Movimientos</span>
            <h3>Historial reciente</h3>
          </div>
          <StatusPill tone="info">Mock data</StatusPill>
        </div>
        <div className="history-table">
          <div className="history-head">
            <span>Fecha</span>
            <span>Concepto</span>
            <span>Categoria</span>
            <span>Soporte</span>
            <span>Valor</span>
          </div>
          {historyItems.map((item) => (
            <div key={`${item.date}-${item.title}`} className="history-row">
              <span>{item.date}</span>
              <strong>{item.title}</strong>
              <span>{item.category}</span>
              <StatusPill tone={item.supportReady ? "success" : "warning"}>
                {item.supportReady ? "Adjunto" : "Pendiente"}
              </StatusPill>
              <span className={item.amount.startsWith("+") ? "income" : "expense"}>
                {item.amount}
              </span>
            </div>
          ))}
        </div>
      </PanelCard>
    </div>
  );
}

function StatisticsView() {
  return (
    <div className="dual-grid">
      <PanelCard>
        <div className="card-heading">
          <div>
            <span className="section-tag">Distribucion</span>
            <h3>Gastos por categoria</h3>
          </div>
        </div>
        <div className="stat-list">
          {categoryStats.map((item) => (
            <div key={item.label} className="stat-item">
              <div className="stat-topline">
                <strong>{item.label}</strong>
                <span>{item.share}%</span>
              </div>
              <div className="progress-track" aria-hidden="true">
                <span className={item.tone} style={{ width: `${item.share}%` }} />
              </div>
              <small>{item.amount}</small>
            </div>
          ))}
        </div>
      </PanelCard>

      <PanelCard>
        <div className="card-heading">
          <div>
            <span className="section-tag">Lectura rapida</span>
            <h3>Indicadores del periodo</h3>
          </div>
        </div>
        <div className="insight-grid">
          <MetricCard
            label="Crecimiento de ingresos"
            value="+12%"
            detail="Frente al mes anterior"
            tone="success"
          />
          <MetricCard
            label="Gastos deducibles"
            value="68%"
            detail="Sobre el total registrado"
            tone="accent"
          />
          <MetricCard
            label="Soportes completos"
            value="19/24"
            detail="Cinco aun pendientes"
            tone="neutral"
          />
        </div>
      </PanelCard>
    </div>
  );
}

function ProfileView() {
  return (
    <div className="dual-grid">
      <PanelCard className="profile-card">
        <div className="profile-header">
          <div className="profile-avatar">AC</div>
          <div>
            <h3>Andres Calderon</h3>
            <p>Freelancer independiente</p>
            <small>andres@cuentasclaras.demo</small>
          </div>
        </div>
      </PanelCard>

      <div className="stack-layout">
        {profileSections.map((section) => (
          <PanelCard key={section.title}>
            <div className="card-heading">
              <div>
                <span className="section-tag">{section.kicker}</span>
                <h3>{section.title}</h3>
              </div>
            </div>
            <div className="profile-list">
              {section.items.map((item) => (
                <div key={item.label} className="profile-row">
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          </PanelCard>
        ))}
      </div>
    </div>
  );
}

function AiReportView() {
  return (
    <div className="stack-layout">
      <PanelCard className="ai-hero">
        <div className="card-heading">
          <div>
            <span className="section-tag">Resumen inteligente</span>
            <h3>Observaciones preliminares del periodo</h3>
          </div>
          <StatusPill tone="info">Placeholder</StatusPill>
        </div>
        <div className="report-summary">
          <div className="summary-line">
            <span>Ingresos estimados</span>
            <strong>$ 12.480.000</strong>
          </div>
          <div className="summary-line">
            <span>Gastos potencialmente deducibles</span>
            <strong>$ 3.240.000</strong>
          </div>
          <div className="summary-line">
            <span>Movimientos por revisar</span>
            <strong>2</strong>
          </div>
        </div>
      </PanelCard>

      <div className="dual-grid">
        <PanelCard>
          <div className="card-heading">
            <div>
              <span className="section-tag">Recomendaciones</span>
              <h3>Senales detectadas</h3>
            </div>
          </div>
          <div className="recommendation-list">
            {aiHighlights.map((item) => (
              <article key={item.title} className="recommendation-item">
                <div className="recommendation-mark">IA</div>
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.description}</p>
                </div>
              </article>
            ))}
          </div>
        </PanelCard>

        <PanelCard>
          <div className="card-heading">
            <div>
              <span className="section-tag">Siguiente paso</span>
              <h3>Que falta para cerrar el borrador</h3>
            </div>
          </div>
          <div className="checklist">
            <div className="check-item">
              <div>
                <strong>Validar soportes faltantes</strong>
                <p>Subir dos comprobantes antes del siguiente corte.</p>
              </div>
              <StatusPill tone="warning">Pendiente</StatusPill>
            </div>
            <div className="check-item">
              <div>
                <strong>Revisar gastos no clasificados</strong>
                <p>Hay un movimiento de hogar y uno de salud por confirmar.</p>
              </div>
              <StatusPill tone="info">En revision</StatusPill>
            </div>
            <div className="check-item">
              <div>
                <strong>Exportar resumen preliminar</strong>
                <p>Placeholder para el flujo futuro de reporte descargable.</p>
              </div>
              <StatusPill tone="neutral">Luego</StatusPill>
            </div>
          </div>
        </PanelCard>
      </div>
    </div>
  );
}
