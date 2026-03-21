'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { notificationSchema, NotificationFormData } from '@/lib/validations';
import { Notification } from '@/types';
import {
  createNotification,
  updateNotification,
  deleteNotification,
  toggleNotificationActive,
} from './actions';
import { createClient } from '@/lib/supabaseClient';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/admin/Modal';
import {
  Bell,
  Info,
  Tag,
  CalendarClock,
  AlertCircle,
  AlertTriangle,
  Edit2,
  Power,
  Trash2,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useTransition } from 'react';

interface NotificationsClientProps {
  initialNotifications: Notification[];
}

type RealtimeNotificationPayload = {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: Notification;
  old: Notification;
};

const typeConfig = {
  info: { icon: Info, color: '#3b82f6', bgColor: '#dbeafe', textColor: '#1e40af', label: 'Info' },
  offer: { icon: Tag, color: '#ec4899', bgColor: '#fce7f3', textColor: '#9d174d', label: 'Offer' },
  event: { icon: CalendarClock, color: '#8b5cf6', bgColor: '#ede9fe', textColor: '#5b21b6', label: 'Event' },
  timing: { icon: AlertCircle, color: '#f97316', bgColor: '#ffedd5', textColor: '#9a3412', label: 'Timing' },
  warning: { icon: AlertTriangle, color: '#ef4444', bgColor: '#fee2e2', textColor: '#991b1b', label: 'Warning' },
};

export default function NotificationsClient({ initialNotifications }: NotificationsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingNotification, setEditingNotification] = useState<Notification | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors }
  } = useForm<NotificationFormData>({
    resolver: zodResolver(notificationSchema as any),
    defaultValues: {
      title: '',
      body: '',
      type: 'info',
      is_active: true,
      pinned: false,
      expires_at: null,
    }
  });

  // Real-time subscription
  useEffect(() => {
    const client = createClient();

    const channel = client
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
        },
        (payload: RealtimeNotificationPayload) => {
          const eventType = payload.eventType;
          const notification = payload.new as Notification;

          setNotifications((prev) => {
            if (eventType === 'DELETE') {
              return prev.filter((n) => n.id !== payload.old.id);
            }
            if (eventType === 'UPDATE' || eventType === 'INSERT') {
              const exists = prev.some((n) => n.id === notification.id);
              if (exists) {
                return prev.map((n) => (n.id === notification.id ? notification : n));
              }
              return [notification, ...prev];
            }
            return prev;
          });
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, []);

  const openCreateModal = () => {
    setEditingNotification(null);
    reset({
      title: '',
      body: '',
      type: 'info',
      is_active: true,
      pinned: false,
      expires_at: null,
    });
    setModalOpen(true);
  };

  const openEditModal = (notification: Notification) => {
    setEditingNotification(notification);
    reset({
      title: notification.title,
      body: notification.body || '',
      type: notification.type as NotificationFormData['type'],
      is_active: notification.is_active,
      pinned: notification.pinned,
      expires_at: notification.expires_at || null,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingNotification(null);
    reset();
  };

  const onSubmit = (data: NotificationFormData) => {
    startTransition(async () => {
      try {
        if (editingNotification) {
          await updateNotification(editingNotification.id, data);
          toast.success('Notification updated');
          // Local state already updates via real-time or we could update manually
        } else {
          await createNotification(data);
          toast.success('Notification broadcast');
          router.refresh(); // Get the new ID and timestamps
        }
        closeModal();
      } catch (error: any) {
        toast.error(error.message || 'Operation failed');
      }
    });
  };

  const handleDeleteClick = (notification: Notification) => {
    setDeleteConfirmId(notification.id);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;

    startTransition(async () => {
      try {
        await deleteNotification(deleteConfirmId);
        toast.success('Notification deleted');
        setDeleteConfirmId(null);
      } catch (error: any) {
        toast.error(error.message || 'Deletion failed');
      }
    });
  };

  const handleToggleActive = async (notification: Notification) => {
    startTransition(async () => {
      try {
        await toggleNotificationActive(notification.id, notification.is_active);
        toast.success(`Notification ${notification.is_active ? 'disabled' : 'enabled'}`);
      } catch (error: any) {
        toast.error(error.message || 'Failed to toggle');
      }
    });
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const openModal = editingNotification ? 'Edit Notification' : 'Broadcast Signal';
  const submitLabel = editingNotification ? 'Update Signal' : 'Broadcast Signal';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Active Signals</h1>
          <p className="page-subtitle">Manage storefront banners and notifications</p>
        </div>
        <button onClick={openCreateModal} className="btn-primary">
          <Bell size={16} /> Broadcast Signal
        </button>
      </div>

      {/* Notification Cards */}
      <div className="space-y-5">
        {notifications.map((notification) => {
          const config = typeConfig[notification.type as keyof typeof typeConfig];
          const TypeIcon = config.icon;
          const isDimmed = !notification.is_active;

          return (
            <div
              key={notification.id}
              className={`bg-white border border-[#E5E5E0] rounded-[1.25rem] p-6 shadow-sm flex flex-col gap-5 transition-opacity lg:flex-row ${
                isDimmed ? 'opacity-60' : ''
              }`}
            >
              {/* Left: Type Icon */}
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: config.bgColor }}
              >
                <TypeIcon size={20} style={{ color: config.color }} />
              </div>

              {/* Center: Content */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <h3 className="font-bold text-lg" style={{ color: 'var(--ink)' }}>{notification.title}</h3>
                  {notification.pinned && (
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px] uppercase font-bold flex items-center gap-1"
                      style={{ background: '#fef3c7', color: '#92400e' }}
                    >
                      <ShieldCheck size={10} /> PINNED
                    </span>
                  )}
                </div>
                {notification.body && (
                  <p className="text-sm line-clamp-2" style={{ color: 'var(--stone)' }}>
                    {notification.body}
                  </p>
                )}
                <div className="flex flex-wrap gap-3 mt-4 text-xs" style={{ color: 'var(--stone)' }}>
                  <span
                    className="px-2 py-0.5 rounded"
                    style={{ background: 'var(--surface-secondary)' }}
                  >
                    Type: {config.label}
                  </span>
                  {notification.expires_at && (
                    <span className="flex items-center gap-1">
                      <CalendarClock size={12} />
                      Exp: {formatDate(notification.expires_at)}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <CalendarClock size={12} />
                    Created: {formatDate(notification.created_at)}
                  </span>
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex w-full flex-row gap-3 border-t border-[#E5E5E0] pt-4 lg:w-auto lg:flex-col lg:border-l lg:border-t-0 lg:pl-4 lg:pt-0">
                <button
                  onClick={() => openEditModal(notification)}
                  className="btn-sm flex-1 lg:flex-none"
                  style={{ background: '#eff6ff', color: '#1e40af' }}
                >
                  <Edit2 size={14} /> Edit
                </button>
                <button
                  onClick={() => handleToggleActive(notification)}
                  className="btn-sm flex-1 lg:flex-none"
                  style={{
                    background: notification.is_active ? '#f3f4f6' : '#dcfce7',
                    color: notification.is_active ? 'var(--stone)' : '#166534',
                  }}
                  disabled={isPending}
                >
                  <Power size={14} /> {notification.is_active ? 'Disable' : 'Enable'}
                </button>
                <button
                  onClick={() => handleDeleteClick(notification)}
                  className="btn-sm flex-1 text-red-500 lg:flex-none"
                  disabled={isPending}
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>
          );
        })}

        {notifications.length === 0 && (
          <div className="empty-state">
            <Bell size={40} className="empty-state-icon" />
            <p className="empty-state-text">No signals. Broadcast one above.</p>
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={openModal}
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--ink)' }}>Title</label>
            <input
              {...register('title')}
              placeholder="Notification title"
              className="input-base"
            />
            {errors.title && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{errors.title.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--ink)' }}>Body (optional)</label>
            <textarea
              {...register('body')}
              placeholder="Detailed message"
              className="input-base"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--ink)' }}>Type</label>
            <select {...register('type')} className="input-base">
              <option value="info">Info</option>
              <option value="offer">Offer</option>
              <option value="event">Event</option>
              <option value="timing">Timing</option>
              <option value="warning">Warning</option>
            </select>
          </div>

          <div className="rounded-2xl border border-[#E5E5E0] bg-[var(--surface-secondary)] px-4 py-3">
            <div className="flex items-center gap-2.5">
              <input type="checkbox" id="pinned" {...register('pinned')} className="w-5 h-5 rounded accent-ember" />
              <label htmlFor="pinned" className="text-sm font-medium cursor-pointer" style={{ color: 'var(--ink)' }}>
                Pin to top of storefront
              </label>
            </div>
          </div>

          <div className="rounded-2xl border border-[#E5E5E0] bg-[var(--surface-secondary)] px-4 py-3">
            <div className="flex items-center gap-2.5">
              <input type="checkbox" id="is_active" {...register('is_active')} className="w-5 h-5 rounded accent-ember" />
              <label htmlFor="is_active" className="text-sm font-medium cursor-pointer" style={{ color: 'var(--ink)' }}>
                Active immediately
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--ink)' }}>Expires At (optional)</label>
            <input
              type="datetime-local"
              {...register('expires_at')}
              className="input-base"
            />
            <p className="text-xs mt-1" style={{ color: 'var(--stone)' }}>Leave empty for no expiry</p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t" style={{ borderColor: 'var(--border-default)' }}>
            <button type="button" onClick={closeModal} className="btn-ghost">
              Cancel
            </button>
            <button type="submit" disabled={isPending} className="btn-primary">
              {isPending ? 'Saving...' : submitLabel}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      {deleteConfirmId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setDeleteConfirmId(null)}
        >
          <div
            className="bg-white rounded-[1.25rem] border border-[#E5E5E0] shadow-xl w-full max-w-md p-7"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--ink)' }}>Delete Notification</h3>
            <p className="mb-4" style={{ color: 'var(--stone)' }}>
              Are you sure you want to delete this notification? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setDeleteConfirmId(null)} className="btn-ghost">
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isPending}
                className="btn-primary"
                style={{ background: '#ef4444', borderColor: '#ef4444' }}
              >
                {isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
