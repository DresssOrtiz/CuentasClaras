import { useEffect, useMemo, useState, type FormEvent } from "react";

import { CATEGORIES_BY_TYPE } from "./constants";
import { MetricCard, PanelCard, StatusPill } from "./components/ui";
import { aiHighlights, monthlyBars, profileSections, quickActions, taxChecklist } from "./data/mockData";
import {
  createMovement,
  deleteMovement,
  deleteMovementSupport,
  fetchHealth as getHealth,
  fetchMovements,
  fetchMovementStats,
  uploadMovementSupport,
  updateMovement,
} from "./lib/api";
import type {
  CategoryBreakdownItem,
  HealthResponse,
  Movement,
  MovementPayload,
  MovementStats,
  MovementType,
  MovementUpdatePayload,
} from "./types";

type ViewId = "inicio" | "historial" | "estadisticas" | "perfil" | "reporte-ia";

type NavItem = {
  id: ViewId;
  label: string;
  icon: string;
};

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
  const [movements, setMovements] = useState<Movement[]>([]);
  const [movementsError, setMovementsError] = useState<string | null>(null);
  const [loadingMovements, setLoadingMovements] = useState(true);
  const [stats, setStats] = useState<MovementStats | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [submittingMovement, setSubmittingMovement] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [historyMessage, setHistoryMessage] = useState<string | null>(null);
  const [editingMovement, setEditingMovement] = useState<Movement | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingMovementId, setDeletingMovementId] = useState<number | null>(null);
  const [uploadingSupportId, setUploadingSupportId] = useState<number | null>(null);
  const [deletingSupportId, setDeletingSupportId] = useState<number | null>(null);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const payload = await getHealth();
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

  useEffect(() => {
    void loadMovements();
    void loadStats();
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

  const movementSummary = useMemo(() => {
    const totalIncome = stats ? Number(stats.total_income) : 0;
    const totalExpense = stats ? Number(stats.total_expense) : 0;
    const totalMovements = stats?.total_movements ?? movements.length;
    const totalExpenseMovements =
      stats?.total_expense_movements ??
      movements.filter((movement) => movement.type === "expense").length;

    return {
      totalIncome: formatCurrency(totalIncome),
      totalExpense: formatCurrency(totalExpense),
      movementCount: String(totalMovements),
      draftProgress:
        totalMovements === 0 ? "0%" : `${Math.min(95, 30 + totalMovements * 12)}%`,
      pendingReview: totalExpenseMovements,
      supportCount: stats?.movements_with_support ?? 0,
      withoutSupportCount: stats?.movements_without_support ?? totalMovements,
    };
  }, [movements, stats]);

  async function loadMovements() {
    setLoadingMovements(true);
    setMovementsError(null);

    try {
      const data = await fetchMovements();
      setMovements(data);
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "No fue posible consultar los movimientos";

      setMovementsError(message);
    } finally {
      setLoadingMovements(false);
    }
  }

  async function loadStats() {
    setLoadingStats(true);
    setStatsError(null);

    try {
      const data = await fetchMovementStats();
      setStats(data);
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "No fue posible consultar las estadisticas";

      setStatsError(message);
    } finally {
      setLoadingStats(false);
    }
  }

  async function handleCreateMovement(payload: MovementPayload): Promise<boolean> {
    setSubmittingMovement(true);
    setSubmitMessage(null);

    try {
      await createMovement(payload);
      setSubmitMessage(
        payload.type === "income"
          ? "Ingreso registrado correctamente."
          : "Gasto registrado correctamente.",
      );
      await loadMovements();
      await loadStats();
      setActiveView("historial");
      return true;
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "No fue posible registrar el movimiento";

      setSubmitMessage(message);
      return false;
    } finally {
      setSubmittingMovement(false);
    }
  }

  async function refreshMovementData() {
    await Promise.all([loadMovements(), loadStats()]);
  }

  async function handleUpdateMovement(
    movementId: number,
    payload: MovementUpdatePayload,
  ): Promise<boolean> {
    setSavingEdit(true);
    setHistoryMessage(null);

    try {
      await updateMovement(movementId, payload);
      await refreshMovementData();
      setEditingMovement(null);
      setHistoryMessage("Movimiento actualizado correctamente.");
      return true;
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "No fue posible actualizar el movimiento";

      setHistoryMessage(message);
      return false;
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleDeleteMovement(movement: Movement) {
    const confirmed = window.confirm(
      `¿Eliminar el movimiento "${movement.description}"? Esta acción no se puede deshacer.`,
    );

    if (!confirmed) {
      return;
    }

    setDeletingMovementId(movement.id);
    setHistoryMessage(null);

    try {
      await deleteMovement(movement.id);
      if (editingMovement?.id === movement.id) {
        setEditingMovement(null);
      }
      await refreshMovementData();
      setHistoryMessage("Movimiento eliminado correctamente.");
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "No fue posible eliminar el movimiento";

      setHistoryMessage(message);
    } finally {
      setDeletingMovementId(null);
    }
  }

  async function handleUploadSupport(movement: Movement, file: File) {
    setUploadingSupportId(movement.id);
    setHistoryMessage(null);

    try {
      await uploadMovementSupport(movement.id, file);
      await refreshMovementData();
      setHistoryMessage(
        movement.support
          ? "Soporte reemplazado correctamente."
          : "Soporte adjuntado correctamente.",
      );
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "No fue posible adjuntar el soporte";

      setHistoryMessage(message);
    } finally {
      setUploadingSupportId(null);
    }
  }

  async function handleDeleteSupport(movement: Movement) {
    const confirmed = window.confirm(
      `¿Eliminar el soporte de "${movement.description}"?`,
    );

    if (!confirmed) {
      return;
    }

    setDeletingSupportId(movement.id);
    setHistoryMessage(null);

    try {
      await deleteMovementSupport(movement.id);
      await refreshMovementData();
      setHistoryMessage("Soporte eliminado correctamente.");
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "No fue posible eliminar el soporte";

      setHistoryMessage(message);
    } finally {
      setDeletingSupportId(null);
    }
  }

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

        <section className="content-shell">
          {renderView({
            view: activeView,
            apiStatus,
            movementSummary,
            movements,
            movementsError,
            loadingMovements,
            stats,
            statsError,
            loadingStats,
            onCreateMovement: handleCreateMovement,
            submittingMovement,
            submitMessage,
            editingMovement,
            onStartEditMovement: setEditingMovement,
            onCancelEditMovement: () => setEditingMovement(null),
            onUpdateMovement: handleUpdateMovement,
            onDeleteMovement: handleDeleteMovement,
            savingEdit,
            deletingMovementId,
            uploadingSupportId,
            deletingSupportId,
            historyMessage,
            onUploadSupport: handleUploadSupport,
            onDeleteSupport: handleDeleteSupport,
          })}
        </section>
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

function renderView({
  view,
  apiStatus,
  movementSummary,
  movements,
  movementsError,
  loadingMovements,
  stats,
  statsError,
  loadingStats,
  onCreateMovement,
  submittingMovement,
  submitMessage,
  editingMovement,
  onStartEditMovement,
  onCancelEditMovement,
  onUpdateMovement,
  onDeleteMovement,
  savingEdit,
  deletingMovementId,
  uploadingSupportId,
  deletingSupportId,
  historyMessage,
  onUploadSupport,
  onDeleteSupport,
}: {
  view: ViewId;
  apiStatus: string;
  movementSummary: {
    totalIncome: string;
    totalExpense: string;
    movementCount: string;
    draftProgress: string;
    pendingReview: number;
  };
  movements: Movement[];
  movementsError: string | null;
  loadingMovements: boolean;
  stats: MovementStats | null;
  statsError: string | null;
  loadingStats: boolean;
  onCreateMovement: (payload: MovementPayload) => Promise<boolean>;
  submittingMovement: boolean;
  submitMessage: string | null;
  editingMovement: Movement | null;
  onStartEditMovement: (movement: Movement | null) => void;
  onCancelEditMovement: () => void;
  onUpdateMovement: (movementId: number, payload: MovementUpdatePayload) => Promise<boolean>;
  onDeleteMovement: (movement: Movement) => Promise<void>;
  savingEdit: boolean;
  deletingMovementId: number | null;
  uploadingSupportId: number | null;
  deletingSupportId: number | null;
  historyMessage: string | null;
  onUploadSupport: (movement: Movement, file: File) => Promise<void>;
  onDeleteSupport: (movement: Movement) => Promise<void>;
}) {
  switch (view) {
    case "inicio":
      return (
        <HomeView
          apiStatus={apiStatus}
          movementSummary={movementSummary}
          onCreateMovement={onCreateMovement}
          submittingMovement={submittingMovement}
          submitMessage={submitMessage}
        />
      );
    case "historial":
      return (
        <HistoryView
          loadingMovements={loadingMovements}
          movements={movements}
          movementsError={movementsError}
          editingMovement={editingMovement}
          onStartEditMovement={onStartEditMovement}
          onCancelEditMovement={onCancelEditMovement}
          onUpdateMovement={onUpdateMovement}
          onDeleteMovement={onDeleteMovement}
          savingEdit={savingEdit}
          deletingMovementId={deletingMovementId}
          uploadingSupportId={uploadingSupportId}
          deletingSupportId={deletingSupportId}
          historyMessage={historyMessage}
          onUploadSupport={onUploadSupport}
          onDeleteSupport={onDeleteSupport}
        />
      );
    case "estadisticas":
      return (
        <StatisticsView
          stats={stats}
          statsError={statsError}
          loadingStats={loadingStats}
        />
      );
    case "perfil":
      return <ProfileView />;
    case "reporte-ia":
      return <AiReportView movementCount={stats?.total_movements ?? movements.length} />;
    default:
      return (
        <HomeView
          apiStatus={apiStatus}
          movementSummary={movementSummary}
          onCreateMovement={onCreateMovement}
          submittingMovement={submittingMovement}
          submitMessage={submitMessage}
        />
      );
  }
}

function HomeView({
  apiStatus,
  movementSummary,
  onCreateMovement,
  submittingMovement,
  submitMessage,
}: {
  apiStatus: string;
  movementSummary: {
    totalIncome: string;
    totalExpense: string;
    movementCount: string;
    draftProgress: string;
    pendingReview: number;
    supportCount?: number;
    withoutSupportCount?: number;
  };
  onCreateMovement: (payload: MovementPayload) => Promise<boolean>;
  submittingMovement: boolean;
  submitMessage: string | null;
}) {
  return (
    <div className="view-grid">
      <section className="hero-banner">
        <div>
          <p className="section-tag">Panel principal</p>
          <h3>Registro y seguimiento real de movimientos</h3>
          <p>
            Ya puedes registrar ingresos y gastos en la base de datos y verlos
            reflejados en el historial del producto.
          </p>
        </div>
        <div className="hero-aside">
          <StatusPill tone="success">Al dia</StatusPill>
          <span className="due-chip">
            Movimientos registrados: {movementSummary.movementCount}
          </span>
        </div>
      </section>

      <div className="metrics-grid">
        {[
          {
            label: "Total ingresos",
            value: movementSummary.totalIncome,
            detail: "Calculado desde movimientos reales",
            tone: "success" as const,
          },
          {
            label: "Total gastos",
            value: movementSummary.totalExpense,
            detail: "Calculado desde movimientos reales",
            tone: "accent" as const,
          },
          {
            label: "Cantidad de movimientos",
            value: movementSummary.movementCount,
            detail: "Ingresos y gastos guardados",
            tone: "neutral" as const,
          },
          {
            label: "Borrador tributario",
            value: movementSummary.draftProgress,
            detail: "Indicador basico de avance",
            tone: "warning" as const,
          },
        ].map((metric) => (
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

        <MovementFormCard
          onSubmit={onCreateMovement}
          submitting={submittingMovement}
          message={submitMessage}
        />
      </div>

      <div className="dual-grid">
        <PanelCard>
          <div className="card-heading">
            <div>
              <span className="section-tag">Estado general</span>
              <h3>Recordatorio y soporte</h3>
            </div>
          </div>
          <div className="support-note">
            <p>
              Este panel ya usa datos reales para tus totales principales.
              Puedes alternar entre ingresos y gastos y luego revisar el
              historial consolidado.
            </p>
            <ul className="mini-list">
              <li>{movementSummary.pendingReview} gastos requieren seguimiento visual.</li>
              <li>
                {movementSummary.supportCount ?? 0} movimientos con soporte y{" "}
                {movementSummary.withoutSupportCount ?? 0} sin soporte.
              </li>
              <li>El historial se alimenta desde PostgreSQL.</li>
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

function HistoryView({
  loadingMovements,
  movements,
  movementsError,
  editingMovement,
  onStartEditMovement,
  onCancelEditMovement,
  onUpdateMovement,
  onDeleteMovement,
  savingEdit,
  deletingMovementId,
  uploadingSupportId,
  deletingSupportId,
  historyMessage,
  onUploadSupport,
  onDeleteSupport,
}: {
  loadingMovements: boolean;
  movements: Movement[];
  movementsError: string | null;
  editingMovement: Movement | null;
  onStartEditMovement: (movement: Movement | null) => void;
  onCancelEditMovement: () => void;
  onUpdateMovement: (movementId: number, payload: MovementUpdatePayload) => Promise<boolean>;
  onDeleteMovement: (movement: Movement) => Promise<void>;
  savingEdit: boolean;
  deletingMovementId: number | null;
  uploadingSupportId: number | null;
  deletingSupportId: number | null;
  historyMessage: string | null;
  onUploadSupport: (movement: Movement, file: File) => Promise<void>;
  onDeleteSupport: (movement: Movement) => Promise<void>;
}) {
  return (
    <div className="stack-layout">
      {editingMovement ? (
        <MovementFormCard
          title="Editar movimiento"
          sectionTag="Edición"
          submitLabel="Guardar cambios"
          initialMovement={editingMovement}
          onSubmit={(payload) => onUpdateMovement(editingMovement.id, payload)}
          onCancel={onCancelEditMovement}
          submitting={savingEdit}
          message={historyMessage}
        />
      ) : null}

      <PanelCard>
        <div className="card-heading">
          <div>
            <span className="section-tag">Movimientos</span>
            <h3>Historial reciente</h3>
          </div>
          <StatusPill tone="info">Datos reales</StatusPill>
        </div>
        {historyMessage && !editingMovement ? (
          <p className="form-feedback">{historyMessage}</p>
        ) : null}
        {loadingMovements ? <p className="empty-state">Cargando movimientos...</p> : null}
        {movementsError ? <p className="empty-state">{movementsError}</p> : null}
        {!loadingMovements && !movementsError && movements.length === 0 ? (
          <div className="empty-card">
            <strong>Aun no hay movimientos registrados.</strong>
            <p>Usa el formulario del inicio para crear tu primer ingreso o gasto.</p>
          </div>
        ) : null}
        {!loadingMovements && !movementsError && movements.length > 0 ? (
          <div className="history-table">
            <div className="history-head">
              <span>Fecha</span>
              <span>Concepto</span>
              <span>Categoria</span>
              <span>Tipo</span>
              <span>Soporte</span>
              <span>Valor</span>
            </div>
            {movements.map((movement) => (
              <div key={movement.id} className="history-row">
                <span>{formatDate(movement.date)}</span>
                <strong>{movement.description}</strong>
                <span>{movement.category}</span>
                <StatusPill tone={movement.type === "income" ? "success" : "warning"}>
                  {movement.type === "income" ? "Ingreso" : "Gasto"}
                </StatusPill>
                <div className="support-cell">
                  <StatusPill tone={movement.support ? "success" : "neutral"}>
                    {movement.support ? "Con soporte" : "Sin soporte"}
                  </StatusPill>
                  <small className="support-meta">
                    {movement.support
                      ? `${movement.support.original_filename} · ${readableContentType(movement.support.content_type)}`
                      : "Adjunta una imagen o PDF"}
                  </small>
                  <div className="inline-actions">
                    <label className="inline-action-button">
                      {uploadingSupportId === movement.id
                        ? "Subiendo..."
                        : movement.support
                          ? "Reemplazar soporte"
                          : "Adjuntar soporte"}
                      <input
                        type="file"
                        className="visually-hidden"
                        accept=".pdf,image/png,image/jpeg,image/webp"
                        disabled={uploadingSupportId === movement.id}
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) {
                            void onUploadSupport(movement, file);
                          }
                          event.currentTarget.value = "";
                        }}
                      />
                    </label>
                    {movement.support ? (
                      <button
                        type="button"
                        className="inline-action-button danger"
                        disabled={deletingSupportId === movement.id}
                        onClick={() => void onDeleteSupport(movement)}
                      >
                        {deletingSupportId === movement.id
                          ? "Quitando..."
                          : "Eliminar soporte"}
                      </button>
                    ) : null}
                  </div>
                </div>
                <div className="history-actions-cell">
                  <span className={movement.type === "income" ? "income" : "expense"}>
                    {movement.type === "income" ? "+" : "-"}
                    {formatCurrency(Number(movement.amount))}
                  </span>
                  <div className="inline-actions">
                    <button
                      type="button"
                      className="inline-action-button"
                      onClick={() => onStartEditMovement(movement)}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className="inline-action-button danger"
                      onClick={() => void onDeleteMovement(movement)}
                      disabled={deletingMovementId === movement.id}
                    >
                      {deletingMovementId === movement.id ? "Eliminando..." : "Eliminar"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </PanelCard>
    </div>
  );
}

function StatisticsView({
  stats,
  statsError,
  loadingStats,
}: {
  stats: MovementStats | null;
  statsError: string | null;
  loadingStats: boolean;
}) {
  const incomeBreakdown = stats?.income_by_category ?? [];
  const expenseBreakdown = stats?.expense_by_category ?? [];

  return (
    <div className="stack-layout">
      <div className="metrics-grid">
        <MetricCard
          label="Total ingresos"
          value={formatCurrency(Number(stats?.total_income ?? 0))}
          detail="Agregado real desde PostgreSQL"
          tone="success"
        />
        <MetricCard
          label="Total gastos"
          value={formatCurrency(Number(stats?.total_expense ?? 0))}
          detail="Agregado real desde PostgreSQL"
          tone="accent"
        />
        <MetricCard
          label="Movimientos"
          value={String(stats?.total_movements ?? 0)}
          detail="Conteo real registrado"
          tone="neutral"
        />
        <MetricCard
          label="Con soporte"
          value={String(stats?.movements_with_support ?? 0)}
          detail={`${stats?.movements_without_support ?? 0} sin soporte`}
          tone="warning"
        />
      </div>

      {loadingStats ? <p className="empty-state">Cargando estadisticas...</p> : null}
      {statsError ? <p className="empty-state">{statsError}</p> : null}

      <div className="dual-grid">
        <PanelCard>
          <div className="card-heading">
            <div>
              <span className="section-tag">Resumen</span>
              <h3>Conteos del periodo</h3>
            </div>
            <StatusPill tone="info">Datos reales</StatusPill>
          </div>
          <div className="summary-stat-grid">
            <div className="summary-stat-card">
              <strong>{stats?.total_income_movements ?? 0}</strong>
              <span>Ingresos</span>
            </div>
            <div className="summary-stat-card">
              <strong>{stats?.total_expense_movements ?? 0}</strong>
              <span>Gastos</span>
            </div>
            <div className="summary-stat-card">
              <strong>{stats?.total_movements ?? 0}</strong>
              <span>Total movimientos</span>
            </div>
          </div>
        </PanelCard>

        <PanelCard>
          <div className="card-heading">
            <div>
              <span className="section-tag">Lectura rapida</span>
              <h3>Distribucion general</h3>
            </div>
          </div>
          <div className="checklist">
            <div className="check-item">
              <div>
                <strong>Participacion de gastos</strong>
                <p>Porcentaje del total monetario registrado.</p>
              </div>
              <StatusPill tone="warning">
                {calculateShare(
                  Number(stats?.total_expense ?? 0),
                  Number(stats?.total_income ?? 0) + Number(stats?.total_expense ?? 0),
                )}
              </StatusPill>
            </div>
            <div className="check-item">
              <div>
                <strong>Participacion de ingresos</strong>
                <p>Porcentaje del total monetario registrado.</p>
              </div>
              <StatusPill tone="success">
                {calculateShare(
                  Number(stats?.total_income ?? 0),
                  Number(stats?.total_income ?? 0) + Number(stats?.total_expense ?? 0),
                )}
              </StatusPill>
            </div>
          </div>
        </PanelCard>
      </div>

      <div className="dual-grid">
        <PanelCard>
          <div className="card-heading">
            <div>
              <span className="section-tag">Ingresos</span>
              <h3>Desglose por categoria</h3>
            </div>
          </div>
          <CategoryStatsList items={incomeBreakdown} total={Number(stats?.total_income ?? 0)} />
        </PanelCard>

        <PanelCard>
          <div className="card-heading">
            <div>
              <span className="section-tag">Gastos</span>
              <h3>Desglose por categoria</h3>
            </div>
          </div>
          <CategoryStatsList items={expenseBreakdown} total={Number(stats?.total_expense ?? 0)} />
        </PanelCard>
      </div>
    </div>
  );
}

function CategoryStatsList({
  items,
  total,
}: {
  items: CategoryBreakdownItem[];
  total: number;
}) {
  return (
    <div className="stat-list">
      {items.map((item, index) => (
        <div key={item.category} className="stat-item">
          <div className="stat-topline">
            <strong>{item.category}</strong>
            <span>{calculateShare(Number(item.total_amount), total)}</span>
          </div>
          <div className="progress-track" aria-hidden="true">
            <span
              className={index % 2 === 0 ? "primary" : "accent"}
              style={{ width: `${calculateShareValue(Number(item.total_amount), total)}%` }}
            />
          </div>
          <small>
            {formatCurrency(Number(item.total_amount))} - {item.movement_count} movimiento
            {item.movement_count === 1 ? "" : "s"}
          </small>
        </div>
      ))}
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

function AiReportView({ movementCount }: { movementCount: number }) {
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
            <strong>{movementCount}</strong>
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

function MovementFormCard({
  onSubmit,
  submitting,
  message,
  initialMovement,
  title = "Nuevo movimiento",
  sectionTag = "Registro real",
  submitLabel,
  onCancel,
}: {
  onSubmit: (payload: MovementPayload) => Promise<boolean>;
  submitting: boolean;
  message: string | null;
  initialMovement?: Movement | null;
  title?: string;
  sectionTag?: string;
  submitLabel?: string;
  onCancel?: () => void;
}) {
  const [movementType, setMovementType] = useState<MovementType>(
    initialMovement?.type ?? "income",
  );
  const [formData, setFormData] = useState<MovementPayload>({
    type: initialMovement?.type ?? "income",
    category: initialMovement?.category ?? "",
    amount: initialMovement?.amount ?? "",
    description: initialMovement?.description ?? "",
    date: initialMovement?.date ?? todayString(),
  });

  useEffect(() => {
    const nextType = initialMovement?.type ?? "income";
    setMovementType(nextType);
    setFormData({
      type: nextType,
      category: initialMovement?.category ?? "",
      amount: initialMovement?.amount ?? "",
      description: initialMovement?.description ?? "",
      date: initialMovement?.date ?? todayString(),
    });
  }, [initialMovement]);

  function updateField(field: keyof MovementPayload, value: string) {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function switchType(nextType: MovementType) {
    setMovementType(nextType);
    setFormData((current) => ({
      ...current,
      type: nextType,
      category: "",
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const wasCreated = await onSubmit({
      ...formData,
      type: movementType,
    });

    if (wasCreated && !initialMovement) {
      setFormData({
        type: movementType,
        category: "",
        amount: "",
        description: "",
        date: todayString(),
      });
    }
  }

  const categoryOptions = CATEGORIES_BY_TYPE[movementType];

  return (
    <PanelCard>
      <div className="card-heading">
        <div>
          <span className="section-tag">{sectionTag}</span>
          <h3>{title}</h3>
        </div>
        {onCancel ? (
          <button type="button" className="inline-action-button" onClick={onCancel}>
            Cancelar
          </button>
        ) : null}
      </div>
      <div className="segmented-control" role="tablist" aria-label="Tipo de movimiento">
        <button
          type="button"
          className={movementType === "income" ? "active" : ""}
          onClick={() => switchType("income")}
        >
          Registrar ingreso
        </button>
        <button
          type="button"
          className={movementType === "expense" ? "active" : ""}
          onClick={() => switchType("expense")}
        >
          Registrar gasto
        </button>
      </div>
      <form className="movement-form" onSubmit={handleSubmit}>
        <label className="field-stack">
          <span>Categoria</span>
          <select
            required
            value={formData.category}
            onChange={(event) => updateField("category", event.target.value)}
          >
            <option value="">Selecciona una categoria</option>
            {categoryOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="field-stack">
          <span>Monto</span>
          <input
            required
            min="0.01"
            step="0.01"
            type="number"
            value={formData.amount}
            onChange={(event) => updateField("amount", event.target.value)}
            placeholder="0.00"
          />
        </label>

        <label className="field-stack">
          <span>Descripcion</span>
          <input
            required
            type="text"
            value={formData.description}
            onChange={(event) => updateField("description", event.target.value)}
            placeholder="Ej. Pago proyecto abril"
          />
        </label>

        <label className="field-stack">
          <span>Fecha</span>
          <input
            required
            type="date"
            value={formData.date}
            onChange={(event) => updateField("date", event.target.value)}
          />
        </label>

        <button type="submit" className="primary-submit" disabled={submitting}>
          {submitting
            ? "Guardando..."
            : submitLabel ??
              (movementType === "income" ? "Guardar ingreso" : "Guardar gasto")}
        </button>
      </form>
      {message ? <p className="form-feedback">{message}</p> : null}
    </PanelCard>
  );
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function readableContentType(contentType: string): string {
  if (contentType === "application/pdf") {
    return "PDF";
  }

  if (contentType.startsWith("image/")) {
    return "Imagen";
  }

  return contentType;
}

function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

function calculateShare(value: number, total: number): string {
  return `${calculateShareValue(value, total)}%`;
}

function calculateShareValue(value: number, total: number): number {
  if (total <= 0 || value <= 0) {
    return 0;
  }

  return Math.round((value / total) * 100);
}
