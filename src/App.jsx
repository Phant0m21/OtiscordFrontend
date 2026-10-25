import React, { useEffect, useMemo, useRef, useState } from 'react';
import { api, clearToken, getToken, setToken, websocketUrl } from './api.js';

const MAX_ATTACHMENT_SIZE = 50 * 1024 * 1024;

const icons = {
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  smile: <><circle cx="12" cy="12" r="9" /><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01" /></>,
  send: <><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></>,
  more: <><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></>,
  phone: <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.2 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.96.36 1.9.7 2.8a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.84.58 2.8.7A2 2 0 0 1 22 16.92Z" />,
  video: <><rect x="3" y="5" width="13" height="14" rx="2" /><path d="m16 10 5-3v10l-5-3" /></>,
  image: <><rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" /></>,
  file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6M8 13h8M8 17h8" /></>,
  close: <path d="m18 6-12 12M6 6l12 12" />,
  back: <path d="m15 18-6-6 6-6" />,
  check: <path d="m5 12 4 4L19 6" />,
  edit: <><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z" /></>,
  trash: <><path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m4 4v6m6-6v6" /></>,
  users: <><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="10" cy="7" r="4" /><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
  bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></>,
  monitor: <><rect x="3" y="4" width="18" height="13" rx="2" /><path d="M8 21h8m-4-4v4" /></>,
  settings: <><path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" /><path d="m19.4 15 .1.1a1.7 1.7 0 0 1-2.4 2.4l-.1-.1a1.7 1.7 0 0 0-2.9 1.2v.2a1.7 1.7 0 0 1-3.4 0v-.2a1.7 1.7 0 0 0-2.9-1.2l-.1.1a1.7 1.7 0 0 1-2.4-2.4l.1-.1a1.7 1.7 0 0 0-1.2-2.9H4a1.7 1.7 0 0 1 0-3.4h.2a1.7 1.7 0 0 0 1.2-2.9l-.1-.1a1.7 1.7 0 0 1 2.4-2.4l.1.1a1.7 1.7 0 0 0 2.9-1.2V2a1.7 1.7 0 0 1 3.4 0v.2a1.7 1.7 0 0 0 2.9 1.2l.1-.1a1.7 1.7 0 0 1 2.4 2.4l-.1.1a1.7 1.7 0 0 0 1.2 2.9h.2a1.7 1.7 0 0 1 0 3.4h-.2a1.7 1.7 0 0 0-1.2 2.9Z" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" /></>,
  moon: <path d="M20.9 13A8.5 8.5 0 0 1 11 3.1 8.5 8.5 0 1 0 20.9 13Z" />,
  shield: <><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" /><path d="m9 12 2 2 4-4" /></>,
  type: <><path d="M4 7V4h16v3M9 20h6m-3-16v16" /></>,
  info: <><circle cx="12" cy="12" r="10" /><path d="M12 16v-4m0-4h.01" /></>,
  bold: <path d="M6 12h7a4 4 0 0 0 0-8H6v16h8a4 4 0 0 0 0-8H6Z" />,
  italic: <><path d="M19 4h-9M14 20H5M15 4 9 20" /></>,
  strike: <><path d="M4 12h16M17 7a5 5 0 0 0-8.5-2.5M7 17a5 5 0 0 0 8.5 2.5" /></>,
  underline: <><path d="M7 4v6a5 5 0 0 0 10 0V4M5 21h14" /></>,
  code: <><path d="m8 17-5-5 5-5m8 10 5-5-5-5m-3-7-2 20" /></>,
  expand: <><path d="M8 3H5a2 2 0 0 0-2 2v3m13-5h3a2 2 0 0 1 2 2v3M3 16v3a2 2 0 0 0 2 2h3m13-5v3a2 2 0 0 1-2 2h-3" /></>,
  download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4m4-5 5 5 5-5m-5 5V3" /></>,
  eye: <><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></>,
};

function Icon({ name, size = 20, ...props }) {
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>{icons[name]}</svg>;
}

function Avatar({ user, large = false }) {
  const initials = user?.username?.slice(0, 1).toUpperCase() || '?';
  return <div className={`avatar avatar-${user?.avatar_color || 'mint'} ${large ? 'avatar-large' : ''}`}>{initials}</div>;
}

function formatTime(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('ru', { hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

function AuthScreen({ onAuthenticated, startupError }) {
  const [page, setPage] = useState('welcome');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(startupError || '');
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError('');
    const form = new FormData(event.currentTarget);
    const password = String(form.get('password') || '');
    if (page === 'register' && password !== form.get('password_confirmation')) {
      setError('Пароли не совпадают.');
      return;
    }
    setBusy(true);
    try {
      const result = await api(`/api/auth/${page}`, {
        token: null,
        method: 'POST',
        body: JSON.stringify({
          email: form.get('email'),
          password,
          ...(page === 'register' ? { username: form.get('username') } : {}),
        }),
      });
      setToken(result.access_token);
      onAuthenticated(result.user);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-screen">
      <div className="auth-glow auth-glow-one" /><div className="auth-glow auth-glow-two" />
      {page === 'welcome' ? (
        <section className="welcome-card">
          <div className="brand-mark">o</div>
          <p className="eyebrow">ТВОЁ ПРОСТРАНСТВО ДЛЯ ОБЩЕНИЯ</p>
          <h1>Otiscord</h1>
          <p className="welcome-subtitle">Здесь начинается общение</p>
          {error && <p className="auth-error">{error}</p>}
          <div className="welcome-actions">
            <button className="button button-primary" onClick={() => { setError(''); setPage('login'); }}>Войти</button>
            <button className="button button-outline" onClick={() => { setError(''); setPage('register'); }}>Создать аккаунт</button>
          </div>
          <div className="auth-footnote"><span className="tiny-dot" /> Твои люди уже здесь</div>
        </section>
      ) : (
        <section className="auth-card">
          <button className="auth-back" onClick={() => setPage('welcome')} aria-label="Назад"><Icon name="back" size={18} /></button>
          <div className="auth-brand">Otiscord</div>
          <h1>{page === 'login' ? 'С возвращением!' : 'Создать аккаунт'}</h1>
          <p className="auth-description">{page === 'login' ? 'Рады видеть тебя снова' : 'Начни общаться с друзьями'}</p>
          <form className="auth-form" onSubmit={submit}>
            {page === 'register' && <label className="field-label">Имя пользователя<input name="username" required minLength={2} maxLength={32} placeholder="Как тебя называть?" autoComplete="nickname" /></label>}
            <label className="field-label">Электронная почта<input name="email" required type="email" maxLength={254} placeholder="example@mail.com" autoComplete="email" /></label>
            <label className="field-label">Пароль
              <span className="password-wrap">
                <input name="password" required type={showPassword ? 'text' : 'password'} placeholder="Не менее 8 символов" minLength={8} maxLength={128} autoComplete={page === 'login' ? 'current-password' : 'new-password'} />
                <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>{showPassword ? 'Скрыть' : 'Показать'}</button>
              </span>
            </label>
            {page === 'register' && <label className="field-label">Подтверди пароль<input name="password_confirmation" required type="password" minLength={8} maxLength={128} placeholder="Повтори пароль" autoComplete="new-password" /></label>}
            {page === 'login' && <button type="button" className="forgot-link" onClick={() => setError('Для восстановления пароля пока напиши администратору проекта.')}>Забыли пароль?</button>}
            {error && <p className="auth-error">{error}</p>}
            <button className="button button-primary auth-submit" type="submit" disabled={busy}>{busy ? 'Подключаемся…' : page === 'login' ? 'Войти в Otiscord' : 'Зарегистрироваться'}<Icon name="back" className="submit-arrow" size={17} /></button>
          </form>
          <p className="auth-switch">{page === 'login' ? 'Впервые здесь?' : 'Уже есть аккаунт?'}<button onClick={() => { setError(''); setPage(page === 'login' ? 'register' : 'login'); }}>{page === 'login' ? 'Создать аккаунт' : 'Войти'}</button></p>
          <p className="auth-terms">Твои данные хранятся в защищённой базе данных</p>
        </section>
      )}
    </main>
  );
}

function Modal({ title, onClose, children, className = '' }) {
  return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section className={`modal-card ${className}`} role="dialog" aria-modal="true" aria-label={title}><div className="modal-heading"><h2>{title}</h2><button className="icon-button" onClick={onClose} aria-label="Закрыть"><Icon name="close" /></button></div>{children}</section></div>;
}

const reactionChoices = ['❤️', '😂', '🔥', '👍', '👀', '🎉', '😮', '💚'];

const inlineFormatPattern = /(\*\*[^*]+\*\*|~~[^~]+~~|__[^_]+__|\|\|[^|]+\|\||\*[^*]+\*|_[^_]+_|`[^`]+`)/g;

function Spoiler({ children }) {
  const [revealed, setRevealed] = useState(false);
  return <span className={`message-spoiler ${revealed ? 'spoiler-revealed' : ''}`} onClick={() => setRevealed((value) => !value)}>{children}</span>;
}

function renderInlineText(text, keyPrefix = 'inline') {
  return text.split(inlineFormatPattern).map((part, index) => {
    if (!part) return null;
    const key = `${keyPrefix}-${index}`;
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={key}>{renderInlineText(part.slice(2, -2), key)}</strong>;
    if (part.startsWith('~~') && part.endsWith('~~')) return <del key={key}>{renderInlineText(part.slice(2, -2), key)}</del>;
    if (part.startsWith('__') && part.endsWith('__')) return <u key={key}>{renderInlineText(part.slice(2, -2), key)}</u>;
    if (part.startsWith('||') && part.endsWith('||')) return <Spoiler key={key}>{renderInlineText(part.slice(2, -2), key)}</Spoiler>;
    if (part.startsWith('**') || part.startsWith('__')) return part;
    if (part.startsWith('*') && part.endsWith('*')) return <em key={key}>{renderInlineText(part.slice(1, -1), key)}</em>;
    if (part.startsWith('_') && part.endsWith('_')) return <em key={key}>{renderInlineText(part.slice(1, -1), key)}</em>;
    if (part.startsWith('`') && part.endsWith('`')) return <code className="message-inline-code" key={key}>{part.slice(1, -1)}</code>;
    return part;
  });
}

function FormattedMessage({ content }) {
  const blocks = content.split(/(```[\s\S]*?```)/g);
  return blocks.map((block, index) => {
    if (block.startsWith('```') && block.endsWith('```')) {
      const source = block.slice(3, -3).replace(/^[^\r\n]*\r?\n/, '');
      return <pre className="message-code-block" key={`block-${index}`}><code>{source}</code></pre>;
    }
    return <React.Fragment key={`block-${index}`}>{renderInlineText(block, `block-${index}`)}</React.Fragment>;
  });
}

function MessageAttachments({ attachments, onPreview }) {
  return attachments.map((attachment) => {
    const type = attachment.content_type || '';
    if (type.startsWith('image/')) {
      return <button className="attachment-preview attachment-image" key={attachment.id} onClick={() => onPreview(attachment)} aria-label={`Открыть изображение ${attachment.filename}`}><img src={attachment.url} alt={attachment.filename} loading="lazy" /><span>{attachment.filename}</span></button>;
    }
    if (type.startsWith('video/')) {
      return <div className="attachment-preview attachment-video" key={attachment.id}><video src={attachment.url} controls preload="metadata" aria-label={attachment.filename} /><button className="media-expand" onClick={() => onPreview(attachment)} aria-label={`Открыть видео ${attachment.filename}`}><Icon name="expand" size={16} /></button><span>{attachment.filename}</span></div>;
    }
    if (type.startsWith('audio/')) {
      return <div className="attachment-audio" key={attachment.id}><audio src={attachment.url} controls preload="metadata" /><a href={attachment.url} download={attachment.filename}>{attachment.filename}</a></div>;
    }
    return <a className="attachment-file" key={attachment.id} href={attachment.url} download={attachment.filename} target="_blank" rel="noreferrer"><Icon name="file" size={20} /><span><strong>{attachment.filename}</strong><small>{(attachment.size / 1024 / 1024).toFixed(2)} МБ</small></span><Icon name="download" size={17} /></a>;
  });
}

function MediaViewer({ attachment, onClose }) {
  const mediaRef = useRef(null);
  useEffect(() => {
    const closeOnEscape = (event) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);
  const isVideo = attachment.content_type.startsWith('video/');
  return <div className="media-viewer" role="dialog" aria-modal="true" aria-label={attachment.filename} onMouseDown={(event) => event.target === event.currentTarget && onClose()}><button className="media-viewer-close icon-button" onClick={onClose} aria-label="Закрыть просмотр"><Icon name="close" /></button><button className="media-viewer-expand icon-button" onClick={() => mediaRef.current?.requestFullscreen?.()} aria-label="На весь экран"><Icon name="expand" /></button>{isVideo ? <video ref={mediaRef} src={attachment.url} controls autoPlay /> : <img ref={mediaRef} src={attachment.url} alt={attachment.filename} onDoubleClick={() => mediaRef.current?.requestFullscreen?.()} />}<a href={attachment.url} download={attachment.filename}><Icon name="download" size={16} />{attachment.filename}</a></div>;
}

const settingsSections = [
  { id: 'appearance', label: 'Внешний вид', icon: 'sun' },
  { id: 'notifications', label: 'Уведомления', icon: 'bell' },
  { id: 'account', label: 'Мой аккаунт', icon: 'shield' },
  { id: 'about', label: 'О приложении', icon: 'info' },
];

function SettingsPanel({
  user,
  section,
  onSectionChange,
  theme,
  onThemeChange,
  density,
  onDensityChange,
  notificationsEnabled,
  onToggleNotifications,
  onLogout,
  onDeleteAccount,
  deleteBusy,
  deleteError,
}) {
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');

  function submitAccountDeletion(event) {
    event.preventDefault();
    onDeleteAccount(password, confirmation);
  }

  return (
    <Modal title="Настройки Otiscord" onClose={() => onSectionChange('')} className="settings-modal">
      <div className="settings-layout">
        <nav className="settings-nav" aria-label="Разделы настроек">
          {settingsSections.map((item) => (
            <button key={item.id} className={section === item.id ? 'settings-nav-active' : ''} onClick={() => onSectionChange(item.id)}>
              <Icon name={item.icon} size={17} />{item.label}
            </button>
          ))}
          <div className="settings-nav-caption">ПРОФИЛЬ</div>
          <div className="settings-nav-profile"><Avatar user={user} /><span><strong>{user.username}</strong><small>#{user.tag}</small></span></div>
        </nav>
        <div className="settings-content">
          {section === 'appearance' && <>
            <div className="settings-kicker">ПЕРСОНАЛИЗАЦИЯ</div>
            <h3>Внешний вид</h3>
            <p className="settings-description">Настрой Otiscord так, как удобно именно тебе.</p>
            <div className="settings-option">
              <div><strong>Цветовая тема</strong><small>Выбери оформление приложения</small></div>
              <div className="settings-choice-group" role="group" aria-label="Цветовая тема">
                <button className={theme === 'dark' ? 'settings-choice-selected' : ''} onClick={() => onThemeChange('dark')}><Icon name="moon" size={16} />Тёмная</button>
                <button className={theme === 'light' ? 'settings-choice-selected' : ''} onClick={() => onThemeChange('light')}><Icon name="sun" size={16} />Светлая</button>
              </div>
            </div>
            <div className="settings-option">
              <div><strong>Плотность сообщений</strong><small>Измени расстояние между сообщениями</small></div>
              <div className="settings-choice-group" role="group" aria-label="Плотность сообщений">
                <button className={density === 'comfortable' ? 'settings-choice-selected' : ''} onClick={() => onDensityChange('comfortable')}>Обычная</button>
                <button className={density === 'compact' ? 'settings-choice-selected' : ''} onClick={() => onDensityChange('compact')}>Компактная</button>
              </div>
            </div>
            <div className="settings-note"><Icon name="monitor" size={17} /><span>Настройки сохраняются в этом браузере и применяются сразу.</span></div>
          </>}
          {section === 'notifications' && <>
            <div className="settings-kicker">БУДЬ В КУРСЕ</div>
            <h3>Уведомления</h3>
            <p className="settings-description">Выбери, когда Otiscord может отвлечь тебя от других дел.</p>
            <div className="settings-option">
              <div><strong>Уведомления на рабочем столе</strong><small>Показывать новые сообщения, когда вкладка не активна</small></div>
              <button className={`settings-switch ${notificationsEnabled ? 'settings-switch-on' : ''}`} role="switch" aria-checked={notificationsEnabled} onClick={onToggleNotifications}><span /></button>
            </div>
            <div className="settings-note"><Icon name="bell" size={17} /><span>{!('Notification' in window) ? 'Этот браузер не поддерживает системные уведомления.' : Notification.permission === 'denied' ? 'Разреши уведомления для Otiscord в настройках браузера, чтобы включить эту функцию.' : 'Уведомления работают, когда браузер разрешает их показ. Звуковые уведомления пока не поддерживаются.'}</span></div>
          </>}
          {section === 'account' && <>
            <div className="settings-kicker">ЛИЧНЫЕ ДАННЫЕ</div>
            <h3>Мой аккаунт</h3>
            <p className="settings-description">Управляй профилем и доступом к Otiscord.</p>
            <div className="settings-account-card"><Avatar user={user} large /><div><strong>{user.username}</strong><small>{user.username}#{user.tag}</small></div><span className="status-pill">Аккаунт активен</span></div>
            <button className="button button-outline settings-logout" onClick={onLogout}>Выйти из аккаунта</button>
            <div className="settings-danger-zone">
              <strong>Удалить аккаунт</strong>
              <p>Это действие необратимо. Профиль, личные чаты и отправленные тобой сообщения будут удалены. В группах останутся другие участники, а созданная тобой группа перейдёт одному из них.</p>
              <form className="settings-delete-form" onSubmit={submitAccountDeletion}>
                <label className="field-label">Текущий пароль<input type="password" autoComplete="current-password" required minLength={1} maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} /></label>
                <label className="field-label">Для подтверждения введи УДАЛИТЬ<input autoComplete="off" required value={confirmation} onChange={(event) => setConfirmation(event.target.value)} /></label>
                {deleteError && <p className="auth-error">{deleteError}</p>}
                <button className="button button-danger" type="submit" disabled={deleteBusy || confirmation !== 'УДАЛИТЬ'}>{deleteBusy ? 'Удаляем аккаунт…' : 'Удалить аккаунт навсегда'}</button>
              </form>
            </div>
          </>}
          {section === 'about' && <>
            <div className="settings-kicker">ОТКРЫВАЙ БОЛЬШЕ</div>
            <h3>Otiscord сегодня</h3>
            <p className="settings-description">Общение, которое развивается вместе с тобой.</p>
            <div className="settings-feature-list">
              <div><Icon name="check" size={17} /><span><strong>Личные и групповые чаты</strong><small>Ищи людей и создавай разговоры с друзьями</small></span></div>
              <div><Icon name="check" size={17} /><span><strong>Живые сообщения и реакции</strong><small>Общайся и реагируй на сообщения в реальном времени</small></span></div>
              <div><Icon name="check" size={17} /><span><strong>Твои настройки остаются твоими</strong><small>Тема и плотность интерфейса хранятся в браузере</small></span></div>
            </div>
            <div className="settings-roadmap"><strong>В разработке</strong><span>Аудио- и видеозвонки и расширенные настройки профиля.</span></div>
          </>}
        </div>
      </div>
    </Modal>
  );
}

function Messenger({ user, onLogout, theme, onThemeChange, density, onDensityChange, notificationsEnabled, onToggleNotifications }) {
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState('');
  const [messages, setMessages] = useState([]);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');
  const [modal, setModal] = useState('');
  const [modalError, setModalError] = useState('');
  const [newContact, setNewContact] = useState('');
  const [groupName, setGroupName] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showAttach, setShowAttach] = useState(false);
  const [reactionFor, setReactionFor] = useState('');
  const [editingId, setEditingId] = useState('');
  const [pendingDelete, setPendingDelete] = useState(null);
  const [mobileList, setMobileList] = useState(false);
  const [settingsSection, setSettingsSection] = useState('');
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [connection, setConnection] = useState('connecting');
  const [groupMode, setGroupMode] = useState(false);
  const [userSearchResults, setUserSearchResults] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [stagedAttachments, setStagedAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [mediaViewer, setMediaViewer] = useState(null);
  const [formatMenu, setFormatMenu] = useState(null);
  const [unreadByChat, setUnreadByChat] = useState({});
  const fileRef = useRef(null);
  const messageInput = useRef(null);
  const messagesEndRef = useRef(null);
  const messagesRef = useRef(messages);
  const conversationsRef = useRef(conversations);
  const stagedAttachmentsRef = useRef(stagedAttachments);
  const activeIdRef = useRef(activeId);
  const syncCursorRef = useRef(new Date(Date.now() - 60000).toISOString());
  const syncErrorShownAtRef = useRef(0);
  const seenIncomingIdsRef = useRef(new Set());
  const pendingSendRef = useRef(null);
  const notificationsEnabledRef = useRef(notificationsEnabled);
  messagesRef.current = messages;
  conversationsRef.current = conversations;
  stagedAttachmentsRef.current = stagedAttachments;
  activeIdRef.current = activeId;
  notificationsEnabledRef.current = notificationsEnabled;
  const activeChat = conversations.find((item) => item.id === activeId) || null;
  const visibleChats = useMemo(() => conversations.filter((chat) => {
    const others = chat.members.filter((member) => member.id !== user.id).map((member) => member.username).join(' ');
    return `${chat.name} ${others} ${chat.last_message?.content || ''}`.toLowerCase().includes(search.toLowerCase());
  }), [conversations, search, user.id]);

  function showNotice(text) {
    setNotice(text);
    window.setTimeout(() => setNotice(''), 2800);
  }

  function upsertMessage(nextMessage) {
    if (activeIdRef.current === nextMessage.conversation_id) {
      setMessages((current) => current.some((item) => item.id === nextMessage.id)
        ? current.map((item) => item.id === nextMessage.id ? nextMessage : item)
        : [...current, nextMessage].sort((a, b) => new Date(a.created_at) - new Date(b.created_at)));
    }
    setConversations((current) => current.map((item) => item.id === nextMessage.conversation_id
      ? {
        ...item,
        ...(new Date(nextMessage.created_at) >= new Date(item.last_message?.created_at || 0)
          ? { last_message: nextMessage }
          : {}),
        updated_at: new Date(nextMessage.created_at) > new Date(item.updated_at)
          ? nextMessage.created_at
          : item.updated_at,
      }
      : item).sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at)));
  }

  function mergeConversation(nextConversation) {
    setConversations((current) => {
      const existing = current.find((item) => item.id === nextConversation.id);
      const latest = existing && new Date(existing.updated_at) > new Date(nextConversation.updated_at)
        ? { ...nextConversation, last_message: existing.last_message, updated_at: existing.updated_at }
        : nextConversation;
      return [latest, ...current.filter((item) => item.id !== nextConversation.id)]
        .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    });
  }

  function notifyIncoming(incoming) {
    if (incoming.author.id === user.id) return;
    if (seenIncomingIdsRef.current.has(incoming.id)) return;
    seenIncomingIdsRef.current.add(incoming.id);
    if (seenIncomingIdsRef.current.size > 5000) {
      seenIncomingIdsRef.current.delete(seenIncomingIdsRef.current.values().next().value);
    }
    const active = activeIdRef.current === incoming.conversation_id;
    if (!active) {
      setUnreadByChat((current) => ({ ...current, [incoming.conversation_id]: (current[incoming.conversation_id] || 0) + 1 }));
    }
    if (
      (!active || document.visibilityState !== 'visible')
      && notificationsEnabledRef.current
      && 'Notification' in window
      && Notification.permission === 'granted'
    ) {
      const notification = new Notification(`Новое сообщение от ${incoming.author.username}`, {
        body: incoming.content || (incoming.attachments?.length ? 'Отправил(а) файл' : 'Отправил(а) сообщение'),
        tag: incoming.conversation_id,
      });
      notification.onclick = () => {
        window.focus();
        switchToConversation(incoming.conversation_id);
        setUnreadByChat((current) => ({ ...current, [incoming.conversation_id]: 0 }));
      };
    }
  }

  function reflectDeletedMessage(messageId) {
    const deletedAt = new Date().toISOString();
    setMessages((current) => current.map((item) => item.id === messageId
      ? { ...item, content: null, deleted_at: deletedAt, reactions: [] }
      : item));
    setConversations((current) => current.map((item) => item.last_message?.id === messageId
      ? { ...item, last_message: { ...item.last_message, content: null, deleted_at: deletedAt, reactions: [] } }
      : item));
  }

  useEffect(() => {
    let cancelled = false;
    api('/api/conversations').then((result) => {
      if (cancelled) return;
      result.forEach(mergeConversation);
      if (result.length) setActiveId((current) => current || result[0].id);
    }).catch((error) => showNotice(error.message)).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!activeId) {
      setMessages([]);
      return undefined;
    }
    let cancelled = false;
    setMessages([]);
    api(`/api/conversations/${activeId}/messages`).then((result) => {
      if (cancelled) return;
      setMessages((current) => {
        const merged = new Map(result.map((item) => [item.id, item]));
        current.forEach((item) => {
          if (item.conversation_id === activeId && !merged.has(item.id)) merged.set(item.id, item);
        });
        return [...merged.values()].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      });
    }).catch((error) => { if (!cancelled) showNotice(error.message); });
    return () => { cancelled = true; };
  }, [activeId]);

  useEffect(() => {
    let cancelled = false;
    let socket;
    let reconnectTimer;
    let syncTimer;
    let reconnectDelay = 1000;
    const handleIncomingMessage = (messageData, eventType, actorId) => {
      let incoming = messageData;
      if (eventType === 'message_created') {
        notifyIncoming(incoming);
      } else if (actorId !== user.id) {
        const existing = messagesRef.current.find((item) => item.id === incoming.id)
          || conversationsRef.current.find((item) => item.id === incoming.conversation_id)?.last_message;
        incoming = {
          ...incoming,
          reactions: incoming.reactions.map((reaction) => ({
            ...reaction,
            reacted: existing?.reactions?.find((item) => item.emoji === reaction.emoji)?.reacted || false,
          })),
        };
      }
      upsertMessage(incoming);
    };

    const pollChanges = async () => {
      if (cancelled) return;
      try {
        const result = await api(`/api/sync?since=${encodeURIComponent(syncCursorRef.current)}`);
        if (cancelled) return;
        const previousChats = new Map(conversationsRef.current.map((item) => [item.id, item]));
        result.conversations.forEach(mergeConversation);
        result.messages.forEach((incoming) => {
          const previous = previousChats.get(incoming.conversation_id);
          const isNewInbound = incoming.author.id !== user.id
            && (!previous || !previous.last_message || new Date(incoming.created_at) > new Date(previous.last_message.created_at));
          if (isNewInbound) notifyIncoming(incoming);
          upsertMessage(incoming);
        });
        syncCursorRef.current = result.cursor;
      } catch (error) {
        if (!cancelled && getToken()) {
          setConnection((current) => current === 'connected' ? current : 'reconnecting');
          if (Date.now() - syncErrorShownAtRef.current > 15000) {
            showNotice(`Синхронизация временно недоступна: ${error.message}`);
            syncErrorShownAtRef.current = Date.now();
          }
        }
      } finally {
        if (!cancelled) syncTimer = window.setTimeout(pollChanges, 1200);
      }
    };

    const connect = () => {
      if (cancelled) return;
      setConnection('connecting');
      socket = new WebSocket(websocketUrl());
      socket.onopen = () => {
        reconnectDelay = 1000;
        socket.send(JSON.stringify({ token: getToken() }));
      };
      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'connected') {
          setConnection('connected');
          return;
        }
        if (data.type === 'conversation_created') {
          mergeConversation(data.conversation);
          return;
        }
        if (data.type === 'conversation_deleted') {
          const removedId = data.conversation_id;
          setConversations((current) => current.filter((item) => item.id !== removedId));
          setUnreadByChat((current) => {
            const next = { ...current };
            delete next[removedId];
            return next;
          });
          if (activeIdRef.current === removedId) {
            setActiveId('');
            setMessages([]);
          }
          return;
        }
        if (data.type === 'message_created' || data.type === 'message_updated' || data.type === 'reaction_updated') {
          handleIncomingMessage(data.message, data.type, data.actor_id);
        }
        if (data.type === 'message_deleted') reflectDeletedMessage(data.message_id);
      };
      socket.onclose = () => {
        if (cancelled) return;
        setConnection('reconnecting');
        reconnectTimer = window.setTimeout(connect, reconnectDelay);
        reconnectDelay = Math.min(reconnectDelay * 2, 15000);
      };
      socket.onerror = () => setConnection('reconnecting');
    };

    setConnection('connecting');
    connect();
    pollChanges();
    return () => {
      cancelled = true;
      window.clearTimeout(reconnectTimer);
      window.clearTimeout(syncTimer);
      socket?.close();
    };
  }, [user.id]);

  useEffect(() => {
    if (!activeId) return;
    setUnreadByChat((current) => current[activeId] ? { ...current, [activeId]: 0 } : current);
  }, [activeId]);

  useEffect(() => {
    if (!formatMenu) return undefined;
    const closeMenu = (event) => {
      if (event.type === 'keydown' && event.key === 'Escape') setFormatMenu(null);
      if (event.type === 'pointerdown' && !event.target.closest('.format-context-menu')) setFormatMenu(null);
    };
    window.addEventListener('pointerdown', closeMenu);
    window.addEventListener('keydown', closeMenu);
    return () => {
      window.removeEventListener('pointerdown', closeMenu);
      window.removeEventListener('keydown', closeMenu);
    };
  }, [formatMenu]);

  useEffect(() => {
    if (!userSearch.trim() || userSearch.trim().length < 2) {
      setUserSearchResults([]);
      return undefined;
    }
    let cancelled = false;
    const timer = window.setTimeout(() => {
      api(`/api/users/search?q=${encodeURIComponent(userSearch.trim())}`)
        .then((result) => { if (!cancelled) setUserSearchResults(result); })
        .catch((error) => { if (!cancelled) setModalError(error.message); });
    }, 250);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [userSearch]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, activeId]);

  async function selectChat(id) {
    if (uploading) {
      showNotice('Подожди, пока файл загрузится.');
      return;
    }
    switchToConversation(id);
  }

  function switchToConversation(id) {
    if (uploading) {
      showNotice('Подожди, пока файл загрузится.');
      return false;
    }
    if (id !== activeId && stagedAttachmentsRef.current.length) {
      const discarded = stagedAttachmentsRef.current;
      setStagedAttachments([]);
      Promise.all(discarded.map((item) => api(`/api/attachments/${item.id}`, { method: 'DELETE' })))
        .catch((error) => showNotice(`Не удалось очистить один из файлов черновика: ${error.message}`));
      showNotice('Файлы черновика удалены при переходе в другой чат.');
    }
    setActiveId(id);
    if (id !== activeId) setMessages([]);
    setMobileList(false);
    setEditingId('');
    setReactionFor('');
    return true;
  }

  async function addFiles(files) {
    const selectedFiles = [...files];
    if (!activeId || !selectedFiles.length) return;
    if (stagedAttachments.length + selectedFiles.length > 10) {
      showNotice('К одному сообщению можно прикрепить не более 10 файлов.');
      return;
    }
    const oversizedFile = selectedFiles.find((file) => file.size > MAX_ATTACHMENT_SIZE);
    if (oversizedFile) {
      showNotice(`${oversizedFile.name}: максимальный размер файла — 50 МБ.`);
      return;
    }
    setUploading(true);
    setShowAttach(false);
    try {
      for (const file of selectedFiles) {
        const upload = await api(`/api/conversations/${activeId}/attachments`, {
          method: 'POST',
          body: JSON.stringify({
            filename: file.name,
            content_type: file.type || 'application/octet-stream',
            size: file.size,
          }),
        });
        try {
          const response = await fetch(upload.upload_url, {
            method: 'PUT',
            headers: upload.headers,
            body: file,
          });
          if (!response.ok) throw new Error(`Не удалось загрузить ${file.name} (HTTP ${response.status}).`);
          await api(`/api/attachments/${upload.id}/complete`, { method: 'POST' });
          setStagedAttachments((current) => [...current, upload.attachment]);
        } catch (error) {
          await api(`/api/attachments/${upload.id}`, { method: 'DELETE' });
          throw error;
        }
      }
    } catch (error) {
      showNotice(error.message || 'Не удалось загрузить файл.');
    } finally {
      setUploading(false);
    }
  }

  async function removeStagedAttachment(attachment) {
    setStagedAttachments((current) => current.filter((item) => item.id !== attachment.id));
    try {
      await api(`/api/attachments/${attachment.id}`, { method: 'DELETE' });
    } catch (error) {
      showNotice(`Файл удалён из черновика, но не очищен на сервере: ${error.message}`);
    }
  }

  function applyFormatting(prefix, suffix = prefix) {
    const input = messageInput.current;
    if (!input) return;
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const selected = message.slice(start, end);
    const nextValue = `${message.slice(0, start)}${prefix}${selected}${suffix}${message.slice(end)}`;
    setMessage(nextValue);
    setFormatMenu(null);
    window.requestAnimationFrame(() => {
      input.focus();
      input.setSelectionRange(start + prefix.length, end + prefix.length);
    });
  }

  async function sendMessage(event) {
    event.preventDefault();
    const content = message.trim();
    if ((!content && !stagedAttachments.length) || !activeId || busy || uploading) return;
    setBusy(true);
    const conversationId = activeId;
    const attachmentSnapshot = editingId ? [] : stagedAttachments;
    const previousConversation = conversationsRef.current.find((item) => item.id === conversationId);
    const originalMessage = editingId ? messagesRef.current.find((item) => item.id === editingId) : null;
    const sendFingerprint = JSON.stringify([conversationId, content, attachmentSnapshot.map((item) => item.id)]);
    const clientId = editingId ? null
      : pendingSendRef.current?.fingerprint === sendFingerprint
        ? pendingSendRef.current.id
        : crypto.randomUUID();
    if (!editingId) pendingSendRef.current = { fingerprint: sendFingerprint, id: clientId };
    const optimisticMessage = editingId ? null : {
      id: clientId,
      conversation_id: conversationId,
      content: content || null,
      created_at: new Date().toISOString(),
      edited_at: null,
      deleted_at: null,
      author: user,
      reactions: [],
      attachments: attachmentSnapshot,
    };
    if (optimisticMessage) upsertMessage(optimisticMessage);
    if (originalMessage) upsertMessage({ ...originalMessage, content });
    try {
      const path = editingId ? `/api/messages/${editingId}` : `/api/conversations/${activeId}/messages`;
      const result = await api(path, {
        method: editingId ? 'PATCH' : 'POST',
        body: JSON.stringify({
          content,
          ...(editingId ? {} : {
            client_id: clientId,
            attachment_ids: attachmentSnapshot.map((item) => item.id),
          }),
        }),
      });
      upsertMessage(result);
      if (messageInput.current?.value === message) setMessage('');
      setEditingId('');
      if (!editingId) {
        pendingSendRef.current = null;
        setStagedAttachments([]);
      }
      if (messageInput.current) messageInput.current.style.height = '';
      setShowEmoji(false);
      setShowAttach(false);
    } catch (error) {
      if (optimisticMessage) {
        setMessages((current) => current.filter((item) => item.id !== clientId));
        setConversations((current) => current.map((item) => item.id === conversationId && item.last_message?.id === clientId
          ? { ...item, last_message: previousConversation?.last_message || null, updated_at: previousConversation?.updated_at || item.updated_at }
          : item));
      }
      if (originalMessage) upsertMessage(originalMessage);
      showNotice(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function deleteMessage() {
    if (!pendingDelete) return;
    const messageToRestore = pendingDelete;
    reflectDeletedMessage(messageToRestore.id);
    try {
      await api(`/api/messages/${messageToRestore.id}`, { method: 'DELETE' });
      setPendingDelete(null);
    } catch (error) {
      upsertMessage(messageToRestore);
      showNotice(error.message);
    }
  }

  async function toggleReaction(messageId, emoji) {
    const previous = messagesRef.current.find((item) => item.id === messageId)
      || conversationsRef.current.find((item) => item.last_message?.id === messageId)?.last_message;
    if (!previous) return;
    const reactions = previous.reactions.map((reaction) => ({ ...reaction }));
    const index = reactions.findIndex((reaction) => reaction.emoji === emoji);
    if (index >= 0) {
      if (reactions[index].reacted) {
        reactions[index].count -= 1;
        reactions[index].reacted = false;
      } else {
        reactions[index].count += 1;
        reactions[index].reacted = true;
      }
      if (!reactions[index].count) reactions.splice(index, 1);
    } else {
      reactions.push({ emoji, count: 1, reacted: true });
    }
    upsertMessage({ ...previous, reactions });
    setReactionFor('');
    try {
      const result = await api(`/api/messages/${messageId}/reactions`, { method: 'POST', body: JSON.stringify({ emoji }) });
      upsertMessage(result);
    } catch (error) {
      upsertMessage(previous);
      showNotice(error.message);
    }
  }

  async function openDirect(event) {
    event.preventDefault();
    setModalError('');
    if (uploading) {
      showNotice('Подожди, пока файл загрузится.');
      return;
    }
    const username = newContact.trim().replace(/^@/, '').split('#')[0].trim();
    if (!username) return;
    try {
      const conversation = await api('/api/conversations/direct', { method: 'POST', body: JSON.stringify({ username }) });
      mergeConversation(conversation);
      switchToConversation(conversation.id);
      setModal('');
      setNewContact('');
      setUserSearch('');
      setMobileList(false);
    } catch (error) {
      setModalError(error.message);
    }
  }

  async function createGroup(event) {
    event.preventDefault();
    setModalError('');
    if (uploading) {
      showNotice('Подожди, пока файл загрузится.');
      return;
    }
    const usernames = [...new Set(newContact.split(',').map((item) => item.trim().replace(/^@/, '').split('#')[0]).filter(Boolean))];
    if (!groupName.trim() || usernames.length === 0) {
      setModalError('Укажи название группы и имя хотя бы одного участника.');
      return;
    }
    try {
      const conversation = await api('/api/conversations/group', { method: 'POST', body: JSON.stringify({ name: groupName.trim(), usernames }) });
      mergeConversation(conversation);
      switchToConversation(conversation.id);
      setModal('');
      setGroupName('');
      setNewContact('');
    } catch (error) {
      setModalError(error.message);
    }
  }

  async function chooseUser(username) {
    if (uploading) {
      showNotice('Подожди, пока файл загрузится.');
      return;
    }
    setNewContact(username);
    setUserSearch(username);
    setGroupMode(false);
    setModalError('');
    try {
      const conversation = await api('/api/conversations/direct', { method: 'POST', body: JSON.stringify({ username }) });
      mergeConversation(conversation);
      switchToConversation(conversation.id);
      setModal('');
      setNewContact('');
      setUserSearch('');
      setMobileList(false);
    } catch (error) {
      setModalError(error.message);
    }
  }

  function beginEdit(item) {
    setEditingId(item.id);
    setMessage(item.content || '');
    setReactionFor('');
    window.setTimeout(() => messageInput.current?.focus(), 0);
  }

  function logout() {
    clearToken();
    onLogout();
  }

  async function deleteAccount(password, confirmation) {
    setDeleteBusy(true);
    setDeleteError('');
    try {
      await api('/api/auth/account', {
        method: 'DELETE',
        body: JSON.stringify({ password, confirmation }),
      });
      clearToken();
      onLogout();
    } catch (error) {
      setDeleteError(error.message);
    } finally {
      setDeleteBusy(false);
    }
  }

  return (
    <main className="messenger" data-density={density}>
      <aside className={`sidebar ${mobileList ? 'sidebar-mobile-open' : ''}`}>
        <div className="sidebar-top">
          <button className="brand-lockup" aria-label="Otiscord"><span className="brand-symbol">o</span><span>otiscord</span></button>
          <button className="icon-button sidebar-compose" onClick={() => { setModal('contact'); setModalError(''); }} aria-label="Новый чат"><Icon name="plus" /></button>
        </div>
        <div className="sidebar-section-label"><span>ЛИЧНЫЕ СООБЩЕНИЯ</span><span>{String(conversations.length).padStart(2, '0')}</span></div>
        <label className="chat-search"><Icon name="search" size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Поиск по чатам" aria-label="Поиск по чатам" />{search && <button type="button" onClick={() => setSearch('')} aria-label="Очистить поиск"><Icon name="close" size={15} /></button>}</label>
        <div className="chat-list">
          <div className="list-heading">СООБЩЕНИЯ</div>
          {loading && <p className="empty-search">Загружаем чаты…</p>}
          {!loading && visibleChats.map((chat) => {
            const other = chat.members.find((member) => member.id !== user.id) || chat.members[0] || user;
            return (
              <button key={chat.id} className={`chat-list-item ${activeId === chat.id ? 'chat-selected' : ''}`} onClick={() => selectChat(chat.id)}>
                <Avatar user={chat.kind === 'group' ? { username: chat.name, avatar_color: 'violet' } : other} />
                <span className="chat-list-copy">
                  <span className="chat-list-title">{chat.name}<small>{formatTime(chat.last_message?.created_at || chat.updated_at)}</small></span>
                  <span className="chat-list-preview">{chat.last_message?.deleted_at ? 'Сообщение удалено' : chat.last_message?.content || (chat.kind === 'group' ? 'Групповой чат' : 'Начните разговор')}</span>
                </span>
                {unreadByChat[chat.id] > 0 && <span className="chat-unread-badge">{unreadByChat[chat.id] > 99 ? '99+' : unreadByChat[chat.id]}</span>}
              </button>
            );
          })}
          {!loading && !visibleChats.length && <div className="empty-chat-list">{search ? 'Чаты не найдены' : 'Чатов пока нет. Начни разговор!'}</div>}
        </div>
        <div className="sidebar-bottom"><button className="profile-button" onClick={() => setModal('profile')}><Avatar user={user} /><span className="profile-copy"><strong>{user.username}<small className="user-tag">#{user.tag}</small></strong><small><span className="tiny-dot" /> В сети</small></span><Icon name="more" size={18} /></button><button className="icon-button sidebar-settings" onClick={() => { setDeleteError(''); setSettingsSection('appearance'); }} aria-label="Настройки" title="Настройки"><Icon name="settings" /></button></div>
      </aside>

      <section className={`conversation ${mobileList ? 'conversation-mobile-hidden' : ''}`}>
        <header className="topbar">
          <button className="mobile-back icon-button" onClick={() => setMobileList(true)} aria-label="Список чатов"><Icon name="back" /></button>
          <div className="topbar-search"><Icon name="search" size={17} /><input aria-label="Поиск пользователя" placeholder="Найти человека по имени..." value={userSearch} onChange={(event) => { setUserSearch(event.target.value); if (event.target.value.length > 1) setModal('contact'); }} onFocus={() => setModal('contact')} /></div>
          <button className="button button-primary topbar-add" onClick={() => { setModal('contact'); setModalError(''); }}><Icon name="plus" size={17} /><span>Новый чат</span></button>
          <div className={`connection-pill connection-${connection}`}><span />{connection === 'connected' ? 'В сети' : connection === 'reconnecting' ? 'Переподключение' : connection === 'idle' ? 'Нет активного чата' : 'Подключение'}</div>
        </header>
        {activeChat ? (
          <>
            <div className="conversation-heading">
              <Avatar user={activeChat.kind === 'group' ? { username: activeChat.name, avatar_color: 'violet' } : activeChat.members.find((member) => member.id !== user.id) || user} />
              <div className="conversation-title"><strong>{activeChat.name}<span className="chat-tag">{activeChat.kind === 'group' ? 'группа' : `#${activeChat.members.find((member) => member.id !== user.id)?.tag || ''}`}</span></strong><small>{activeChat.kind === 'group' ? <><Icon name="users" size={13} /> {activeChat.members.length} участников</> : <><span className="tiny-dot" /> Личные сообщения</>}</small></div>
              <div className="conversation-actions"><button className="icon-button" onClick={() => showNotice('Аудиозвонки подключаются отдельно.')} aria-label="Аудиозвонок"><Icon name="phone" /></button><button className="icon-button" onClick={() => showNotice('Видеозвонки подключаются отдельно.')} aria-label="Видеозвонок"><Icon name="video" /></button><span className="action-divider" /><button className="icon-button" onClick={() => setModal('details')} aria-label="Информация о чате"><Icon name="more" /></button></div>
            </div>
            <div className="messages-area" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); addFiles(event.dataTransfer.files); }}>
              <div className="messages-day"><span>ИСТОРИЯ СООБЩЕНИЙ</span></div>
              {messages.length === 0 && <div className="empty-conversation"><div className="empty-conversation-icon">✳</div><h2>Здесь начинается общение</h2><p>Отправь первое сообщение — оно появится здесь.</p></div>}
              {messages.map((item, index) => {
                const mine = item.author.id === user.id;
                const previous = messages[index - 1];
                const grouped = previous && previous.author.id === item.author.id && new Date(item.created_at) - new Date(previous.created_at) < 300000;
                const author = activeChat.members.find((member) => member.id === item.author.id) || item.author;
                return (
                  <div key={item.id} className={`message-row ${mine ? 'message-mine' : ''} ${grouped ? 'message-grouped' : ''}`}>
                    {!mine && (grouped ? <div className="message-avatar-spacer" /> : <Avatar user={author} />)}
                    <div className="message-content">
                      {!mine && !grouped && <div className="message-author">{author.username}<span>#{author.tag}</span></div>}
                      <div className={`message-bubble ${item.deleted_at ? 'message-deleted' : ''} ${!item.content ? 'message-attachment-only' : ''}`}>
                        {item.deleted_at ? 'Это сообщение удалено' : item.content && <FormattedMessage content={item.content} />}
                        {!item.deleted_at && item.attachments?.length > 0 && <div className="message-attachments"><MessageAttachments attachments={item.attachments} onPreview={setMediaViewer} /></div>}
                      </div>
                      {!item.deleted_at && item.reactions?.length > 0 && <div className="message-reactions">{item.reactions.map((reaction) => <button key={reaction.emoji} className={`reaction-chip ${reaction.reacted ? 'reaction-selected' : ''}`} onClick={() => toggleReaction(item.id, reaction.emoji)}>{reaction.emoji}<span>{reaction.count}</span></button>)}<button className="reaction-add" onClick={() => setReactionFor(reactionFor === item.id ? '' : item.id)} aria-label="Добавить реакцию">+</button></div>}
                      {reactionFor === item.id && <div className="message-reaction-picker">{reactionChoices.map((emoji) => <button key={emoji} onClick={() => toggleReaction(item.id, emoji)}>{emoji}</button>)}</div>}
                      {!item.deleted_at && <div className="message-toolbar">
                        <button onClick={() => setReactionFor(reactionFor === item.id ? '' : item.id)} aria-label="Реагировать"><Icon name="smile" size={15} /></button>
                        {mine && <button onClick={() => beginEdit(item)} aria-label="Редактировать сообщение"><Icon name="edit" size={14} /></button>}
                        {mine && <button className="message-delete-button" onClick={() => setPendingDelete(item)} aria-label="Удалить своё сообщение"><Icon name="trash" size={14} /></button>}
                      </div>}
                    </div>
                    <time className="message-time">{formatTime(item.created_at)}{item.edited_at && !item.deleted_at ? ' · изм.' : ''}</time>
                    {mine && <span className="message-check"><Icon name="check" size={14} /></span>}
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
            <div className="composer-wrap">
              {showAttach && <div className="popover attachment-popover"><button onClick={() => { if (fileRef.current) fileRef.current.accept = 'image/*,video/*,audio/*'; fileRef.current?.click(); }}><span className="popover-icon image-icon"><Icon name="image" size={17} /></span>Фото, видео и аудио · до 50 МБ</button><button onClick={() => { if (fileRef.current) fileRef.current.accept = ''; fileRef.current?.click(); }}><span className="popover-icon file-icon"><Icon name="file" size={17} /></span>Любой файл · до 50 МБ</button><input ref={fileRef} type="file" multiple hidden onChange={(event) => { const files = event.target.files; event.target.value = ''; addFiles(files || []); }} /></div>}
              {showEmoji && <div className="popover emoji-popover">{reactionChoices.concat(['😊', '😂', '👋', '✨', '🥹', '🙌', '🤔', '😎']).map((emoji, index) => <button key={`${emoji}-${index}`} onClick={() => { setMessage((current) => `${current}${emoji}`); setShowEmoji(false); messageInput.current?.focus(); }}>{emoji}</button>)}</div>}
              {formatMenu && <div className="format-context-menu" role="menu" aria-label="Форматирование текста" style={{ left: formatMenu.x, top: formatMenu.y }} onContextMenu={(event) => event.preventDefault()}>
                {[
                  { label: 'Жирный', icon: 'bold', prefix: '**' },
                  { label: 'Курсив', icon: 'italic', prefix: '*' },
                  { label: 'Зачёркнутый', icon: 'strike', prefix: '~~' },
                  { label: 'Подчёркнутый', icon: 'underline', prefix: '__' },
                  { label: 'Спойлер', icon: 'eye', prefix: '||' },
                  { label: 'Код', icon: 'code', prefix: '`' },
                  { label: 'Блок кода', icon: 'code', prefix: '```\n', suffix: '\n```' },
                ].map((item) => <button key={item.label} role="menuitem" onMouseDown={(event) => event.preventDefault()} onClick={() => applyFormatting(item.prefix, item.suffix || item.prefix)}><Icon name={item.icon} size={15} />{item.label}</button>)}
              </div>}
              {stagedAttachments.length > 0 && <div className="staged-attachments">{stagedAttachments.map((attachment) => <div className="staged-file" key={attachment.id}><Icon name={attachment.content_type.startsWith('image/') ? 'image' : attachment.content_type.startsWith('video/') ? 'video' : 'file'} size={17} /><span>{attachment.filename}</span><button type="button" disabled={busy} onClick={() => removeStagedAttachment(attachment)} aria-label={`Убрать ${attachment.filename}`}><Icon name="close" size={14} /></button></div>)}</div>}
              {uploading && <div className="upload-status"><span className="tiny-dot" />Загружаем файл в защищённое хранилище…</div>}
              <form className="composer" onSubmit={sendMessage}>
                <button type="button" className={`attach-button ${showAttach ? 'tool-active' : ''}`} disabled={Boolean(editingId) || uploading || busy} onClick={() => { setShowAttach(!showAttach); setShowEmoji(false); }} aria-label="Прикрепить файл"><Icon name="plus" size={23} /></button>
                <div className="composer-input-wrap">
                  <textarea ref={messageInput} rows="1" value={message} disabled={busy || uploading} onChange={(event) => { setMessage(event.target.value); event.currentTarget.style.height = 'auto'; event.currentTarget.style.height = `${Math.min(event.currentTarget.scrollHeight, 120)}px`; }} onContextMenu={(event) => { const input = event.currentTarget; if (input.selectionStart === input.selectionEnd) return; event.preventDefault(); setFormatMenu({ x: Math.min(event.clientX, window.innerWidth - 210), y: Math.min(event.clientY, window.innerHeight - 270) }); }} onKeyDown={(event) => { if (event.key === 'Escape') setFormatMenu(null); if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} onFocus={() => { setShowAttach(false); setShowEmoji(false); }} placeholder={editingId ? 'Измени сообщение...' : 'Написать сообщение...'} aria-label="Сообщение" />
                  <button type="button" className={`emoji-button ${showEmoji ? 'tool-active' : ''}`} onClick={() => { setShowEmoji(!showEmoji); setShowAttach(false); }} aria-label="Выбрать эмодзи"><Icon name="smile" size={21} /></button>
                </div>
                {editingId && <button type="button" className="cancel-edit" onClick={() => { setEditingId(''); setMessage(''); }}>Отмена</button>}
                <button className="button button-primary send-button" type="submit" disabled={(!message.trim() && !stagedAttachments.length) || busy || uploading}><span>{editingId ? 'Сохранить' : 'Отправить'}</span><Icon name="send" size={17} /></button>
              </form>
              <div className="composer-hint">Enter — отправить <span>·</span> Shift + Enter — новая строка <span>·</span> ПКМ по выделенному тексту — форматирование</div>
            </div>
          </>
        ) : (
          <div className="no-active-chat"><div className="brand-mark">o</div><h1>{loading ? 'Загружаем Otiscord…' : 'Добро пожаловать в Otiscord'}</h1><p>{loading ? 'Подключаем твои чаты' : 'Выбери разговор или найди собеседника, чтобы начать общение.'}</p>{!loading && <button className="button button-primary" onClick={() => setModal('contact')}><Icon name="plus" size={17} />Найти собеседника</button>}</div>
        )}
      </section>

      {modal === 'contact' && <Modal title={groupMode ? 'Создать группу' : 'Новый разговор'} onClose={() => { setModal(''); setModalError(''); setUserSearch(''); setNewContact(''); setGroupName(''); setGroupMode(false); }}><div className="modal-tabs"><button className={!groupMode ? 'modal-tab-active' : ''} onClick={() => { setGroupMode(false); setModalError(''); }}>Личное сообщение</button><button className={groupMode ? 'modal-tab-active' : ''} onClick={() => { setGroupMode(true); setModalError(''); }}>Групповой чат</button></div>{groupMode ? <form className="modal-form" onSubmit={createGroup}><label className="field-label">Название группы<input autoFocus value={groupName} onChange={(event) => setGroupName(event.target.value)} maxLength={80} placeholder="Например, Дизайн-команда" /></label><label className="field-label">Участники (имена через запятую)<input value={newContact} onChange={(event) => setNewContact(event.target.value)} placeholder="alex, maria" /></label><p className="modal-copy">Добавь точные имена пользователей, разделяя их запятыми.</p>{modalError && <p className="auth-error">{modalError}</p>}<button className="button button-primary modal-submit" type="submit"><Icon name="users" size={17} />Создать группу</button></form> : <><p className="modal-copy">Ищи по имени пользователя или тегу. Создадим личный чат.</p><label className="field-label">Имя пользователя<input autoFocus value={newContact || userSearch} onChange={(event) => { setNewContact(event.target.value); setUserSearch(event.target.value); }} placeholder="Например, Алексей" /></label>{userSearchResults.length > 0 && <div className="user-search-results">{userSearchResults.map((result) => <button key={result.id} onClick={() => chooseUser(result.username)}><Avatar user={result} /><span><strong>{result.username}</strong><small>#{result.tag}</small></span><Icon name="back" size={17} /></button>)}</div>}{modalError && <p className="auth-error">{modalError}</p>}<form className="modal-form" onSubmit={openDirect}><button className="button button-primary modal-submit" type="submit"><Icon name="search" size={17} />Найти и открыть чат</button></form><div className="modal-tip"><span className="sparkle">✳</span><span>Пользователь должен сначала создать аккаунт Otiscord.</span></div></>}</Modal>}
      {modal === 'profile' && <Modal title="Твой профиль" onClose={() => setModal('')}><div className="profile-modal-user"><Avatar user={user} large /><div><strong>{user.username}</strong><span>{user.username}#{user.tag}</span></div></div><div className="profile-settings-row"><span><Icon name="bell" size={18} />Аккаунт</span><span className="status-pill">Подключён</span></div><button className="button button-outline logout-button" onClick={logout}>Выйти из аккаунта</button><button className="button button-outline settings-open-button" onClick={() => { setModal(''); setSettingsSection('appearance'); }}>Открыть настройки <Icon name="settings" size={16} /></button></Modal>}
      {settingsSection && <SettingsPanel user={user} section={settingsSection} onSectionChange={setSettingsSection} theme={theme} onThemeChange={onThemeChange} density={density} onDensityChange={onDensityChange} notificationsEnabled={notificationsEnabled} onToggleNotifications={onToggleNotifications} onLogout={logout} onDeleteAccount={deleteAccount} deleteBusy={deleteBusy} deleteError={deleteError} />}
      {modal === 'details' && activeChat && <Modal title="Информация о чате" onClose={() => setModal('')}><div className="chat-details-user"><Avatar user={activeChat.kind === 'group' ? { username: activeChat.name, avatar_color: 'violet' } : activeChat.members.find((member) => member.id !== user.id) || user} large /><strong>{activeChat.name}</strong><span>{activeChat.kind === 'group' ? `Групповой чат · ${activeChat.members.length} участников` : activeChat.members.filter((member) => member.id !== user.id).map((member) => `${member.username}#${member.tag}`).join(', ')}</span></div><div className="profile-settings-row"><span><Icon name="users" size={18} />Участники</span><span className="status-pill">{activeChat.members.length}</span></div></Modal>}
      {pendingDelete && <Modal title="Удалить сообщение?" onClose={() => setPendingDelete(null)}><p className="modal-copy">Это удалит сообщение для всех участников чата. Отменить действие будет нельзя.</p><div className="confirm-actions"><button className="button button-outline" onClick={() => setPendingDelete(null)}>Отмена</button><button className="button button-danger" onClick={deleteMessage}>Удалить сообщение</button></div></Modal>}
      {mediaViewer && <MediaViewer attachment={mediaViewer} onClose={() => setMediaViewer(null)} />}
      {notice && <div className="toast"><span className="tiny-dot" />{notice}</div>}
    </main>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [startupError, setStartupError] = useState('');
  const [checkingSession, setCheckingSession] = useState(Boolean(getToken()));
  const [theme, setTheme] = useState(() => localStorage.getItem('otiscord.theme') === 'light' ? 'light' : 'dark');
  const [density, setDensity] = useState(() => localStorage.getItem('otiscord.density') === 'compact' ? 'compact' : 'comfortable');
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => localStorage.getItem('otiscord.notifications') === 'enabled');
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('otiscord.theme', theme);
  }, [theme]);
  useEffect(() => {
    localStorage.setItem('otiscord.density', density);
  }, [density]);
  useEffect(() => {
    localStorage.setItem('otiscord.notifications', notificationsEnabled ? 'enabled' : 'disabled');
  }, [notificationsEnabled]);
  useEffect(() => {
    if (notificationsEnabled && (!('Notification' in window) || Notification.permission !== 'granted')) {
      setNotificationsEnabled(false);
    }
  }, [notificationsEnabled]);

  async function toggleDesktopNotifications() {
    if (notificationsEnabled) {
      setNotificationsEnabled(false);
      return;
    }
    if (!('Notification' in window)) {
      return;
    }
    if (Notification.permission === 'denied') {
      return;
    }
    const permission = Notification.permission === 'granted'
      ? 'granted'
      : await Notification.requestPermission();
    setNotificationsEnabled(permission === 'granted');
  }

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    api('/api/auth/me').then(setUser).catch((error) => {
      setStartupError(error.message);
      if (!getToken()) setUser(null);
    }).finally(() => setCheckingSession(false));
  }, []);
  return (
    <>
      <section className="desktop-only-screen" aria-label="Otiscord доступен на компьютере">
        <div className="desktop-notice-icon"><Icon name="monitor" size={40} /></div>
        <div className="settings-kicker">OTISCORD · DESKTOP</div>
        <h1>Нам нужен экран побольше</h1>
        <p>Otiscord пока доступен только на компьютере. Открой сайт с ноутбука или настольного ПК — мобильная версия появится позже.</p>
        <div className="desktop-notice-footer"><span className="tiny-dot" />Сохрани ссылку и возвращайся с компьютера</div>
      </section>
      {checkingSession
        ? <main className="auth-screen"><div className="auth-brand">Otiscord</div></main>
        : user
          ? <Messenger user={user} onLogout={() => setUser(null)} theme={theme} onThemeChange={setTheme} density={density} onDensityChange={setDensity} notificationsEnabled={notificationsEnabled} onToggleNotifications={toggleDesktopNotifications} />
          : <AuthScreen startupError={startupError} onAuthenticated={setUser} />}
    </>
  );
}
