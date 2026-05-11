import { useEffect, useMemo, useState, type FormEvent } from "react";

import { AuthScreen } from "./components/AuthScreen";
import { CATEGORIES_BY_TYPE, REVIEW_STATUS_OPTIONS } from "./constants";
import { MetricCard, PanelCard, StatusPill } from "./components/ui";
import { aiHighlights, monthlyBars, quickActions } from "./data/mockData";
import {
  clearStoredAuthToken,
  createMovement,
  deleteMovement,
  deleteMovementSupport,
  fetchCurrentUser,
  fetchHealth as getHealth,
  fetchMovements,
  fetchReviewSummary,
  fetchMovementSupportFile,
  fetchMovementStats,
  getStoredAuthToken,
  loginUser,
  registerUser,
  setStoredAuthToken,
  uploadMovementSupport,
  updateMovementReview,
  updateMovement,
} from "./lib/api";
import type {
  AuthPayload,
  CategoryBreakdownItem,
  HealthResponse,
  Movement,
  MovementPayload,
  MovementReviewPayload,
  MovementStats,
  MovementType,
  MovementUpdatePayload,
  ReviewStatus,
  ReviewSummary,
  User,
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
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [movementsError, setMovementsError] = useState<string | null>(null);
  const [loadingMovements, setLoadingMovements] = useState(true);
  const [stats, setStats] = useState<MovementStats | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [reviewSummary, setReviewSummary] = useState<ReviewSummary | null>(null);
  const [reviewSummaryError, setReviewSummaryError] = useState<string | null>(null);
  const [loadingReviewSummary, setLoadingReviewSummary] = useState(true);
  const [submittingMovement, setSubmittingMovement] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [historyMessage, setHistoryMessage] = useState<string | null>(null);
  const [editingMovement, setEditingMovement] = useState<Movement | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [savingReviewId, setSavingReviewId] = useState<number | null>(null);
  const [deletingMovementId, setDeletingMovementId] = useState<number | null>(null);
  const [uploadingSupportId, setUploadingSupportId] = useState<number | null>(null);
  const [deletingSupportId, setDeletingSupportId] = useState<number | null>(null);
  const [viewingSupportId, setViewingSupportId] = useState<number | null>(null);
  const [downloadingSupportId, setDownloadingSupportId] = useState<number | null>(null);

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
    const bootstrapAuth = async () => {
      const token = getStoredAuthToken();

      if (!token) {
        setAuthLoading(false);
        setAuthReady(true);
        setLoadingMovements(false);
        setLoadingStats(false);
        setLoadingReviewSummary(false);
        return;
      }

      try {
        const user = await fetchCurrentUser();
        setCurrentUser(user);
      } catch (requestError) {
        clearStoredAuthToken();
        setAuthMessage(
          requestError instanceof Error
            ? requestError.message
            : "Tu sesion ya no es valida. Inicia sesion de nuevo.",
        );
      } finally {
        setAuthLoading(false);
        setAuthReady(true);
      }
    };

    void bootstrapAuth();
  }, []);

  useEffect(() => {
    if (!authReady) {
      return;
    }

    if (!currentUser) {
      setMovements([]);
      setStats(null);
      setReviewSummary(null);
      setLoadingMovements(false);
      setLoadingStats(false);
      setLoadingReviewSummary(false);
      return;
    }

    void refreshMovementData();
  }, [authReady, currentUser]);

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
      pendingReview: reviewSummary?.pending_movements ?? totalExpenseMovements,
      reviewedCount: reviewSummary?.reviewed_movements ?? 0,
      flaggedCount: reviewSummary?.flagged_movements ?? 0,
      supportCount: stats?.movements_with_support ?? 0,
      withoutSupportCount: stats?.movements_without_support ?? totalMovements,
    };
  }, [movements, reviewSummary, stats]);

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

  async function loadReviewSummary() {
    setLoadingReviewSummary(true);
    setReviewSummaryError(null);

    try {
      const data = await fetchReviewSummary();
      setReviewSummary(data);
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "No fue posible consultar el resumen de revision";

      setReviewSummaryError(message);
    } finally {
      setLoadingReviewSummary(false);
    }
  }

  async function handleAuthenticate(payload: AuthPayload) {
    setAuthLoading(true);
    setAuthMessage(null);

    try {
      const response =
        authMode === "login"
          ? await loginUser(payload)
          : await registerUser(payload);

      setStoredAuthToken(response.access_token);
      setCurrentUser(response.user);
      setActiveView("inicio");
      setAuthMessage(
        authMode === "login"
          ? "Sesion iniciada correctamente."
          : "Cuenta creada correctamente.",
      );
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "No fue posible completar la autenticacion";

      setAuthMessage(message);
    } finally {
      setAuthLoading(false);
    }
  }

  function handleLogout() {
    clearStoredAuthToken();
    setCurrentUser(null);
    setEditingMovement(null);
    setActiveView("inicio");
    setSubmitMessage(null);
    setHistoryMessage(null);
    setAuthMode("login");
    setAuthMessage("Sesion cerrada correctamente.");
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
      await refreshMovementData();
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
    await Promise.all([loadMovements(), loadStats(), loadReviewSummary()]);
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

  async function handleUpdateMovementReview(
    movement: Movement,
    payload: MovementReviewPayload,
  ): Promise<boolean> {
    setSavingReviewId(movement.id);
    setHistoryMessage(null);

    try {
      await updateMovementReview(movement.id, payload);
      await refreshMovementData();
      setHistoryMessage("Revision actualizada correctamente.");
      return true;
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "No fue posible actualizar la revision";

      setHistoryMessage(message);
      return false;
    } finally {
      setSavingReviewId(null);
    }
  }

  async function handleUploadSupport(movement: Movement, file: File) {
    setUploadingSupportId(movement.id);
    setHistoryMessage(null);

    try {
      const support = await uploadMovementSupport(movement.id, file);
      await refreshMovementData();
      const actionLabel = movement.support ? "reemplazado" : "adjuntado";
      setHistoryMessage(
        support.is_mock
          ? `Soporte ${actionLabel} en modo demo. El archivo se muestra como cargado, pero su contenido es simulado.`
          : movement.support
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

  async function handleViewSupport(movement: Movement) {
    setViewingSupportId(movement.id);
    setHistoryMessage(null);

    try {
      const supportFile = await fetchMovementSupportFile(movement.id, "view");
      const objectUrl = URL.createObjectURL(supportFile.blob);
      window.open(objectUrl, "_blank", "noopener,noreferrer");
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
      if (movement.support?.is_mock) {
        setHistoryMessage("Vista demo del soporte abierta en una pestaña nueva.");
      }
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "No fue posible abrir el soporte";

      setHistoryMessage(message);
    } finally {
      setViewingSupportId(null);
    }
  }

  async function handleDownloadSupport(movement: Movement) {
    setDownloadingSupportId(movement.id);
    setHistoryMessage(null);

    try {
      const supportFile = await fetchMovementSupportFile(movement.id, "download");
      const objectUrl = URL.createObjectURL(supportFile.blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = supportFile.filename;
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
      setHistoryMessage(
        movement.support?.is_mock
          ? "Archivo demo descargado correctamente."
          : "Soporte descargado correctamente.",
      );
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "No fue posible descargar el soporte";

      setHistoryMessage(message);
    } finally {
      setDownloadingSupportId(null);
    }
  }

  if (!authReady || (authLoading && getStoredAuthToken())) {
    return (
      <div className="auth-loading-shell">
        <PanelCard className="auth-loading-card">
          <span className="section-tag">Acceso</span>
          <h3>Preparando tu sesion</h3>
          <p className="api-inline">{apiStatus}</p>
        </PanelCard>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <AuthScreen
        apiStatus={apiStatus}
        loading={authLoading}
        mode={authMode}
        message={authMessage}
        onSubmit={handleAuthenticate}
        onSwitchMode={(mode) => {
          setAuthMode(mode);
          setAuthMessage(null);
        }}
      />
    );
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
            <div className="user-chip">
              <strong>{currentUser.name}</strong>
              <small>{currentUser.email}</small>
            </div>
            <StatusPill tone={health ? "success" : error ? "danger" : "info"}>
              {health ? health.status.toUpperCase() : error ? "ERROR" : "SYNC"}
            </StatusPill>
            <span className="api-inline">{apiStatus}</span>
            <button type="button" className="inline-action-button" onClick={handleLogout}>
              Cerrar sesion
            </button>
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
            reviewSummary,
            reviewSummaryError,
            loadingReviewSummary,
            onCreateMovement: handleCreateMovement,
            submittingMovement,
            submitMessage,
            editingMovement,
            onStartEditMovement: setEditingMovement,
            onCancelEditMovement: () => setEditingMovement(null),
            onUpdateMovement: handleUpdateMovement,
            onUpdateMovementReview: handleUpdateMovementReview,
            onDeleteMovement: handleDeleteMovement,
            savingEdit,
            savingReviewId,
            deletingMovementId,
            uploadingSupportId,
            deletingSupportId,
            viewingSupportId,
            downloadingSupportId,
            historyMessage,
            onUploadSupport: handleUploadSupport,
            onViewSupport: handleViewSupport,
            onDownloadSupport: handleDownloadSupport,
            onDeleteSupport: handleDeleteSupport,
            currentUser,
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
  reviewSummary,
  reviewSummaryError,
  loadingReviewSummary,
  onCreateMovement,
  submittingMovement,
  submitMessage,
  editingMovement,
  onStartEditMovement,
  onCancelEditMovement,
  onUpdateMovement,
  onUpdateMovementReview,
  onDeleteMovement,
  savingEdit,
  savingReviewId,
  deletingMovementId,
  uploadingSupportId,
  deletingSupportId,
  viewingSupportId,
  downloadingSupportId,
  historyMessage,
  onUploadSupport,
  onViewSupport,
  onDownloadSupport,
  onDeleteSupport,
  currentUser,
}: {
  view: ViewId;
  apiStatus: string;
  movementSummary: {
    totalIncome: string;
    totalExpense: string;
    movementCount: string;
    draftProgress: string;
    pendingReview: number;
    supportCount?: number;
    withoutSupportCount?: number;
    reviewedCount?: number;
    flaggedCount?: number;
  };
  movements: Movement[];
  movementsError: string | null;
  loadingMovements: boolean;
  stats: MovementStats | null;
  statsError: string | null;
  loadingStats: boolean;
  reviewSummary: ReviewSummary | null;
  reviewSummaryError: string | null;
  loadingReviewSummary: boolean;
  onCreateMovement: (payload: MovementPayload) => Promise<boolean>;
  submittingMovement: boolean;
  submitMessage: string | null;
  editingMovement: Movement | null;
  onStartEditMovement: (movement: Movement | null) => void;
  onCancelEditMovement: () => void;
  onUpdateMovement: (movementId: number, payload: MovementUpdatePayload) => Promise<boolean>;
  onUpdateMovementReview: (
    movement: Movement,
    payload: MovementReviewPayload,
  ) => Promise<boolean>;
  onDeleteMovement: (movement: Movement) => Promise<void>;
  savingEdit: boolean;
  savingReviewId: number | null;
  deletingMovementId: number | null;
  uploadingSupportId: number | null;
  deletingSupportId: number | null;
  viewingSupportId: number | null;
  downloadingSupportId: number | null;
  historyMessage: string | null;
  onUploadSupport: (movement: Movement, file: File) => Promise<void>;
  onViewSupport: (movement: Movement) => Promise<void>;
  onDownloadSupport: (movement: Movement) => Promise<void>;
  onDeleteSupport: (movement: Movement) => Promise<void>;
  currentUser: User;
}) {
  switch (view) {
    case "inicio":
      return (
        <HomeView
          apiStatus={apiStatus}
          movementSummary={movementSummary}
          reviewSummary={reviewSummary}
          reviewSummaryError={reviewSummaryError}
          loadingReviewSummary={loadingReviewSummary}
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
          onUpdateMovementReview={onUpdateMovementReview}
          onDeleteMovement={onDeleteMovement}
          savingEdit={savingEdit}
          savingReviewId={savingReviewId}
          deletingMovementId={deletingMovementId}
          uploadingSupportId={uploadingSupportId}
          deletingSupportId={deletingSupportId}
          viewingSupportId={viewingSupportId}
          downloadingSupportId={downloadingSupportId}
          historyMessage={historyMessage}
          onUploadSupport={onUploadSupport}
          onViewSupport={onViewSupport}
          onDownloadSupport={onDownloadSupport}
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
      return (
        <ProfileView
          user={currentUser}
          stats={stats}
          reviewSummary={reviewSummary}
        />
      );
    case "reporte-ia":
      return <AiReportView movementCount={stats?.total_movements ?? movements.length} />;
    default:
      return (
        <HomeView
          apiStatus={apiStatus}
          movementSummary={movementSummary}
          reviewSummary={reviewSummary}
          reviewSummaryError={reviewSummaryError}
          loadingReviewSummary={loadingReviewSummary}
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
  reviewSummary,
  reviewSummaryError,
  loadingReviewSummary,
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
    reviewedCount?: number;
    flaggedCount?: number;
  };
  reviewSummary: ReviewSummary | null;
  reviewSummaryError: string | null;
  loadingReviewSummary: boolean;
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
              <li>{movementSummary.pendingReview} movimientos siguen pendientes de revision.</li>
              <li>
                {movementSummary.supportCount ?? 0} movimientos con soporte y{" "}
                {movementSummary.withoutSupportCount ?? 0} sin soporte.
              </li>
              <li>
                {movementSummary.reviewedCount ?? 0} revisados y{" "}
                {movementSummary.flaggedCount ?? 0} observados.
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
          {loadingReviewSummary ? <p className="empty-state">Cargando resumen de revision...</p> : null}
          {reviewSummaryError ? <p className="empty-state">{reviewSummaryError}</p> : null}
          {reviewSummary ? (
            <div className="checklist">
              <div className="check-item">
                <div>
                  <strong>Movimientos sin soporte</strong>
                  <p>Registros que aun no tienen evidencia adjunta.</p>
                </div>
                <StatusPill tone={reviewSummary.movements_without_support > 0 ? "warning" : "success"}>
                  {reviewSummary.movements_without_support}
                </StatusPill>
              </div>
              <div className="check-item">
                <div>
                  <strong>Pendientes de revision</strong>
                  <p>Movimientos que todavia no han sido revisados manualmente.</p>
                </div>
                <StatusPill tone={reviewSummary.pending_movements > 0 ? "warning" : "success"}>
                  {reviewSummary.pending_movements}
                </StatusPill>
              </div>
              <div className="check-item">
                <div>
                  <strong>Movimientos observados</strong>
                  <p>Registros marcados con observacion o seguimiento.</p>
                </div>
                <StatusPill tone={reviewSummary.flagged_movements > 0 ? "danger" : "success"}>
                  {reviewSummary.flagged_movements}
                </StatusPill>
              </div>
              <div className="check-item">
                <div>
                  <strong>Listos para revision simple</strong>
                  <p>Movimientos que ya cuentan con soporte y pueden revisarse.</p>
                </div>
                <StatusPill tone="info">{reviewSummary.ready_for_simple_review}</StatusPill>
              </div>
            </div>
          ) : null}
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
  onUpdateMovementReview,
  onDeleteMovement,
  savingEdit,
  savingReviewId,
  deletingMovementId,
  uploadingSupportId,
  deletingSupportId,
  viewingSupportId,
  downloadingSupportId,
  historyMessage,
  onUploadSupport,
  onViewSupport,
  onDownloadSupport,
  onDeleteSupport,
}: {
  loadingMovements: boolean;
  movements: Movement[];
  movementsError: string | null;
  editingMovement: Movement | null;
  onStartEditMovement: (movement: Movement | null) => void;
  onCancelEditMovement: () => void;
  onUpdateMovement: (movementId: number, payload: MovementUpdatePayload) => Promise<boolean>;
  onUpdateMovementReview: (
    movement: Movement,
    payload: MovementReviewPayload,
  ) => Promise<boolean>;
  onDeleteMovement: (movement: Movement) => Promise<void>;
  savingEdit: boolean;
  savingReviewId: number | null;
  deletingMovementId: number | null;
  uploadingSupportId: number | null;
  deletingSupportId: number | null;
  viewingSupportId: number | null;
  downloadingSupportId: number | null;
  historyMessage: string | null;
  onUploadSupport: (movement: Movement, file: File) => Promise<void>;
  onViewSupport: (movement: Movement) => Promise<void>;
  onDownloadSupport: (movement: Movement) => Promise<void>;
  onDeleteSupport: (movement: Movement) => Promise<void>;
}) {
  const [expandedMovementId, setExpandedMovementId] = useState<number | null>(null);

  return (
    <div className="stack-layout">
      {editingMovement ? (
        <MovementFormCard
          title="Editar movimiento"
          sectionTag="Edicion"
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
              <span />
              <span>Fecha</span>
              <span>Concepto</span>
              <span>Categoria</span>
              <span>Tipo</span>
              <span>Soporte</span>
              <span>Revision</span>
              <span>Valor</span>
              <span>Acciones</span>
            </div>
            {movements.map((movement) => {
              const isExpanded = expandedMovementId === movement.id;

              return (
                <article
                  key={movement.id}
                  className={`history-card ${isExpanded ? "expanded" : ""}`}
                >
                  <div className="history-row">
                    <button
                      type="button"
                      className="expand-icon-button"
                      aria-expanded={isExpanded}
                      aria-label={isExpanded ? "Colapsar movimiento" : "Expandir movimiento"}
                      onClick={() =>
                        setExpandedMovementId((current) =>
                          current === movement.id ? null : movement.id,
                        )
                      }
                    >
                      <svg
                        viewBox="0 0 20 20"
                        aria-hidden="true"
                        className={`expand-icon ${isExpanded ? "expanded" : ""}`}
                      >
                        <path
                          d="M5.5 11.5 10 7l4.5 4.5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                    <span>{formatDate(movement.date)}</span>
                    <strong>{movement.description}</strong>
                    <span>{movement.category}</span>
                    <StatusPill tone={movement.type === "income" ? "success" : "warning"}>
                      {movement.type === "income" ? "Ingreso" : "Gasto"}
                    </StatusPill>
                    <StatusPill tone={movement.support ? "success" : "neutral"}>
                      {movement.support ? "Con soporte" : "Sin soporte"}
                    </StatusPill>
                    <StatusPill tone={reviewTone(movement.review_status)}>
                      {reviewLabel(movement.review_status)}
                    </StatusPill>
                    <span className={movement.type === "income" ? "income" : "expense"}>
                      {movement.type === "income" ? "+" : "-"}
                      {formatCurrency(Number(movement.amount))}
                    </span>
                    <div className="history-summary-actions">
                      <button
                        type="button"
                        className="expand-button"
                        aria-expanded={isExpanded}
                        onClick={() =>
                          setExpandedMovementId((current) =>
                            current === movement.id ? null : movement.id,
                          )
                        }
                      >
                        {isExpanded ? "Ocultar detalles" : "Ver detalles"}
                      </button>
                      <button
                        type="button"
                        className="row-menu-button"
                        aria-label="Opciones del movimiento"
                        onClick={() =>
                          setExpandedMovementId((current) =>
                            current === movement.id ? null : movement.id,
                          )
                        }
                      >
                        ...
                      </button>
                    </div>
                  </div>

                  {isExpanded ? (
                    <div className="history-details">
                      <section className="detail-section">
                        <span className="section-tag">Soporte</span>
                        <h4>Archivo y acciones</h4>
                        <div className="detail-support-meta">
                          <strong>
                            {movement.support
                              ? movement.support.original_filename
                              : "Sin soporte adjunto"}
                          </strong>
                          <small>
                            {movement.support
                              ? readableContentType(movement.support.content_type)
                              : "Adjunta una imagen o PDF para continuar"}
                          </small>
                          {movement.support?.is_mock ? (
                            <small className="support-meta support-demo-note">
                              {movement.support.mock_note ??
                                "Demo publica: el archivo se ve cargado, pero su contenido es simulado y temporal."}
                            </small>
                          ) : null}
                        </div>
                        <div className="inline-actions detail-actions">
                          {movement.support ? (
                            <>
                              <button
                                type="button"
                                className="inline-action-button"
                                disabled={viewingSupportId === movement.id}
                                onClick={() => void onViewSupport(movement)}
                              >
                                {viewingSupportId === movement.id
                                  ? "Abriendo..."
                                  : "Ver soporte"}
                              </button>
                              <button
                                type="button"
                                className="inline-action-button"
                                disabled={downloadingSupportId === movement.id}
                                onClick={() => void onDownloadSupport(movement)}
                              >
                                {downloadingSupportId === movement.id
                                  ? "Descargando..."
                                  : "Descargar"}
                              </button>
                            </>
                          ) : null}
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
                      </section>

                      <section className="detail-section detail-section-review">
                        <span className="section-tag">Revision</span>
                        <h4>Estado y nota breve</h4>
                        <ReviewEditor
                          movement={movement}
                          saving={savingReviewId === movement.id}
                          onSubmit={onUpdateMovementReview}
                        />
                      </section>

                      <section className="detail-section detail-section-actions">
                        <span className="section-tag">Acciones del movimiento</span>
                        <h4>Gestion del registro</h4>
                        <div className="inline-actions detail-actions movement-actions">
                          <button
                            type="button"
                            className="inline-action-button"
                            onClick={() => onStartEditMovement(movement)}
                          >
                            Editar movimiento
                          </button>
                          <button
                            type="button"
                            className="inline-action-button danger"
                            onClick={() => void onDeleteMovement(movement)}
                            disabled={deletingMovementId === movement.id}
                          >
                            {deletingMovementId === movement.id
                              ? "Eliminando..."
                              : "Eliminar movimiento"}
                          </button>
                        </div>
                      </section>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        ) : null}
      </PanelCard>
    </div>
  );
}

function ReviewEditor({
  movement,
  saving,
  onSubmit,
}: {
  movement: Movement;
  saving: boolean;
  onSubmit: (movement: Movement, payload: MovementReviewPayload) => Promise<boolean>;
}) {
  const [reviewStatus, setReviewStatus] = useState<ReviewStatus>(movement.review_status);
  const [reviewNote, setReviewNote] = useState(movement.review_note ?? "");

  useEffect(() => {
    setReviewStatus(movement.review_status);
    setReviewNote(movement.review_note ?? "");
  }, [movement.review_note, movement.review_status]);

  return (
    <div className="review-cell">
      <select
        className="review-select"
        value={reviewStatus}
        onChange={(event) => setReviewStatus(event.target.value as ReviewStatus)}
        disabled={saving}
      >
        {REVIEW_STATUS_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <textarea
        className="review-note"
        value={reviewNote}
        onChange={(event) => setReviewNote(event.target.value)}
        placeholder="Nota breve de revision"
        rows={2}
        disabled={saving}
      />
      <button
        type="button"
        className="inline-action-button"
        disabled={saving}
        onClick={() =>
          void onSubmit(movement, {
            review_status: reviewStatus,
            review_note: reviewNote,
          })
        }
      >
        {saving ? "Guardando..." : "Guardar revision"}
      </button>
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

function ProfileView({
  user,
  stats,
  reviewSummary,
}: {
  user: User;
  stats: MovementStats | null;
  reviewSummary: ReviewSummary | null;
}) {
  const initials = user.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((chunk: string) => chunk[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div className="dual-grid">
      <PanelCard className="profile-card">
        <div className="profile-header">
          <div className="profile-avatar">{initials || "CC"}</div>
          <div>
            <h3>{user.name}</h3>
            <p>Usuario autenticado en staging</p>
            <small>{user.email}</small>
          </div>
        </div>
      </PanelCard>

      <div className="stack-layout">
        <PanelCard>
          <div className="card-heading">
            <div>
              <span className="section-tag">Cuenta</span>
              <h3>Informacion real del usuario</h3>
            </div>
          </div>
          <div className="profile-list">
            <div className="profile-row">
              <span>Nombre</span>
              <strong>{user.name}</strong>
            </div>
            <div className="profile-row">
              <span>Correo</span>
              <strong>{user.email}</strong>
            </div>
            <div className="profile-row">
              <span>Miembro desde</span>
              <strong>{formatDateTime(user.created_at)}</strong>
            </div>
          </div>
        </PanelCard>

        <PanelCard>
          <div className="card-heading">
            <div>
              <span className="section-tag">Actividad</span>
              <h3>Resumen de tu expediente</h3>
            </div>
          </div>
          <div className="profile-list">
            <div className="profile-row">
              <span>Movimientos registrados</span>
              <strong>{stats?.total_movements ?? 0}</strong>
            </div>
            <div className="profile-row">
              <span>Movimientos con soporte</span>
              <strong>{stats?.movements_with_support ?? 0}</strong>
            </div>
            <div className="profile-row">
              <span>Movimientos revisados</span>
              <strong>{reviewSummary?.reviewed_movements ?? 0}</strong>
            </div>
            <div className="profile-row">
              <span>Movimientos observados</span>
              <strong>{reviewSummary?.flagged_movements ?? 0}</strong>
            </div>
          </div>
        </PanelCard>
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

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
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

function reviewLabel(status: ReviewStatus): string {
  switch (status) {
    case "reviewed":
      return "Revisado";
    case "flagged":
      return "Observado";
    case "pending":
    default:
      return "Pendiente";
  }
}

function reviewTone(
  status: ReviewStatus,
): "success" | "warning" | "danger" | "info" | "accent" | "neutral" {
  switch (status) {
    case "reviewed":
      return "success";
    case "flagged":
      return "danger";
    case "pending":
    default:
      return "warning";
  }
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
