import { useEffect, useState } from "react";
import DataTable from "../../components/ui/DataTable";
import Button from "../../components/ui/Button";
import StatusBadge from "../../components/ui/StatusBadge";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import EventFormModal from "../../components/EventFormModal";
import ImageUploadModal from "../../components/ImageUploadModal";
import SignupsModal from "../../components/SignupsModal";
import {
  listEvents,
  listArchivedEvents,
  createEvent,
  updateEvent,
  archiveEvent,
  restoreEvent,
  uploadEventImage,
  listSignups,
} from "../../api/healthEventsLocal";

const columns = [
  {
    key: "Photo",
    label: "",
    render: (e) =>
      e.ImagePath ? (
        <img
          src={e.ImagePath}
          alt=""
          className="h-10 w-10 rounded object-cover"
        />
      ) : (
        <div className="h-10 w-10 rounded bg-stone-100" />
      ),
  },
  { key: "Title", label: "Title" },
  { key: "EventType", label: "Type" },
  { key: "EventDate", label: "Date" },
  { key: "Location", label: "Location" },
  {
    key: "Status",
    label: "Status",
    render: (e) => <StatusBadge status={e.Status} />,
  },
];

export default function HealthEvents() {
  const [events, setEvents] = useState([]);
  const [archived, setArchived] = useState([]);
  const [archivedOpen, setArchivedOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  const [imageEvent, setImageEvent] = useState(null);

  const [signupsEvent, setSignupsEvent] = useState(null);
  const [signups, setSignups] = useState([]);
  const [signupsLoading, setSignupsLoading] = useState(false);

  const [confirmAction, setConfirmAction] = useState(null); 
  const [confirmLoading, setConfirmLoading] = useState(false);

  async function loadActive() {
    const res = await listEvents();
    if (res.success) setEvents(res.events);
  }

  async function loadArchived() {
    const res = await listArchivedEvents();
    if (res.success) setArchived(res.events);
  }

  useEffect(() => {
            // eslint-disable-next-line react-hooks/set-state-in-effect
    Promise.all([loadActive(), loadArchived()]).finally(() => setLoading(false));
  }, []);

  function openCreate() {
    setEditingEvent(null);
    setFormOpen(true);
  }

  function openEdit(event) {
    setEditingEvent(event);
    setFormOpen(true);
  }

  async function handleFormSubmit(fields) {
    const res = editingEvent
      ? await updateEvent(editingEvent.EventID, fields)
      : await createEvent(fields);
    if (res.success) {
      setFormOpen(false);
      await loadActive();
    }
    return res;
  }

  async function handleImageUpload(file) {
    const res = await uploadEventImage(imageEvent.EventID, file);
    if (res.success) await loadActive();
    return res;
  }

  async function openSignups(event) {
    setSignupsEvent(event);
    setSignupsLoading(true);
    const res = await listSignups(event.EventID);
    if (res.success) setSignups(res.signups);
    setSignupsLoading(false);
  }

  async function handleConfirm() {
    if (!confirmAction) return;
    setConfirmLoading(true);
    try {
      const fn = confirmAction.type === "archive" ? archiveEvent : restoreEvent;
      const res = await fn(confirmAction.event.EventID);
      if (res.success) {
        await Promise.all([loadActive(), loadArchived()]);
        setConfirmAction(null);
      }
    } finally {
      setConfirmLoading(false);
    }
  }

  const confirmCopy =
    confirmAction?.type === "archive"
      ? {
          title: "Archive event",
          message: `Archive "${confirmAction?.event?.Title}"? It moves to Archived Events.`,
          confirmLabel: "Archive",
          confirmVariant: "dangerSolid",
        }
      : {
          title: "Restore event",
          message: `Restore "${confirmAction?.event?.Title}" back to the active list?`,
          confirmLabel: "Restore",
          confirmVariant: "primary",
        };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-stone-900">Health Events</h1>
        <Button onClick={openCreate}>+ New Event</Button>
      </div>

      <div className="rounded-lg bg-white p-5 shadow-sm">
        <div className="overflow-x-auto">
          {loading ? (
            <p className="py-8 text-center text-sm text-stone-500">
              Loading events…
            </p>
          ) : (
            <DataTable
              columns={columns}
              rows={events.map((e) => ({ id: e.EventID, ...e }))}
              emptyMessage="No health events yet."
              renderActions={(e) => (
                <>
                  <Button variant="primary" onClick={() => openEdit(e)}>
                    Edit
                  </Button>
                  <Button variant="neutral" onClick={() => setImageEvent(e)}>
                    Photo
                  </Button>
                  <Button variant="neutral" onClick={() => openSignups(e)}>
                    Signups
                  </Button>
                  <Button
                    variant="dangerSolid"
                    onClick={() => setConfirmAction({ type: "archive", event: e })}
                  >
                    Archive
                  </Button>
                </>
              )}
            />
          )}
        </div>
      </div>

      <div className="mt-6 rounded-lg bg-white p-5 shadow-sm">
        <button
          onClick={() => setArchivedOpen((o) => !o)}
          className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-emerald-800"
        >
          <span className={`transition-transform ${archivedOpen ? "rotate-90" : ""}`}>
            ▸
          </span>
          Archived Events ({archived.length})
        </button>

        {archivedOpen && (
          <div className="mt-4 overflow-x-auto border-t border-stone-100 pt-4">
            <DataTable
              columns={columns}
              rows={archived.map((e) => ({ id: e.EventID, ...e }))}
              emptyMessage="No archived events."
              renderActions={(e) => (
                <Button
                  variant="primary"
                  onClick={() => setConfirmAction({ type: "restore", event: e })}
                >
                  Restore
                </Button>
              )}
            />
          </div>
        )}
      </div>

      <EventFormModal
        open={formOpen}
        event={editingEvent}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
      />

      <ImageUploadModal
        open={Boolean(imageEvent)}
        title={imageEvent ? `Event Photo — ${imageEvent.Title}` : "Event Photo"}
        currentImage={imageEvent?.ImagePath}
        onClose={() => setImageEvent(null)}
        onUpload={handleImageUpload}
      />

      <SignupsModal
        open={Boolean(signupsEvent)}
        event={signupsEvent}
        signups={signups}
        loading={signupsLoading}
        onClose={() => setSignupsEvent(null)}
      />

      <ConfirmDialog
        open={Boolean(confirmAction)}
        loading={confirmLoading}
        onCancel={() => setConfirmAction(null)}
        onConfirm={handleConfirm}
        {...confirmCopy}
      />
    </div>
  );
}
