import React, { useEffect, useMemo, useRef, useState } from 'react';
import { api, clearToken, getToken, setToken, websocketUrl } from './api.js';

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

function Modal({ title, onClose, children }) {
  return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section className="modal-card" role="dialog" aria-modal="true" aria-label={title}><div className="modal-heading"><h2>{title}</h2><button className="icon-button" onClick={onClose} aria-label="Закрыть"><Icon name="close" /></button></div>{children}</section></div>;
}

const reactionChoices = ['❤️', '😂', '🔥', '👍', '👀', '🎉', '😮', '💚'];

function Messenger({ user, onLogout }) {
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
  const [connection, setConnection] = useState('connecting');
  const [groupMode, setGroupMode] = useState(false);
  const [userSearchResults, setUserSearchResults] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const fileRef = useRef(null);
  const messageInput = useRef(null);
  const messagesEndRef = useRef(null);
  const messagesRef = useRef(messages);
  messagesRef.current = messages;
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
    setMessages((current) => current.some((item) => item.id === nextMessage.id)
      ? current.map((item) => item.id === nextMessage.id ? nextMessage : item)
      : [...current, nextMessage].sort((a, b) => new Date(a.created_at) - new Date(b.created_at)));
    setConversations((current) => current.map((item) => item.id === nextMessage.conversation_id
      ? { ...item, last_message: nextMessage, updated_at: nextMessage.created_at }
      : item).sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at)));
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
      setConversations(result);
      if (result.length) setActiveId((current) => current || result[0].id);
    }).catch((error) => showNotice(error.message)).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!activeId) {
      setMessages([]);
      setConnection('idle');
      return undefined;
    }
    let cancelled = false;
    let socket;
    let reconnectTimer;
    api(`/api/conversations/${activeId}/messages`).then((result) => {
      if (!cancelled) setMessages(result);
    }).catch((error) => { if (!cancelled) showNotice(error.message); });

    const connect = () => {
      if (cancelled) return;
      socket = new WebSocket(websocketUrl());
      socket.onopen = () => socket.send(JSON.stringify({ token: getToken(), conversation_id: activeId }));
      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'connected') setConnection('connected');
        if (data.type === 'message_created' || data.type === 'message_updated' || data.type === 'reaction_updated') {
          let incoming = data.message;
          if (data.type !== 'message_created' && data.actor_id !== user.id) {
            const existing = messagesRef.current.find((item) => item.id === incoming.id);
            incoming = {
              ...incoming,
              reactions: incoming.reactions.map((reaction) => ({
                ...reaction,
                reacted: existing?.reactions?.find((item) => item.emoji === reaction.emoji)?.reacted || false,
              })),
            };
          }
          upsertMessage(incoming);
        }
        if (data.type === 'message_deleted') {
          reflectDeletedMessage(data.message_id);
        }
      };
      socket.onclose = () => {
        if (cancelled) return;
        setConnection('reconnecting');
        reconnectTimer = window.setTimeout(connect, 2500);
      };
      socket.onerror = () => setConnection('reconnecting');
    };
    setConnection('connecting');
    connect();
    return () => {
      cancelled = true;
      window.clearTimeout(reconnectTimer);
      socket?.close();
    };
  }, [activeId, user.id]);

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
    setActiveId(id);
    setMobileList(false);
    setEditingId('');
    setReactionFor('');
  }

  async function sendMessage(event) {
    event.preventDefault();
    const content = message.trim();
    if (!content || !activeId || busy) return;
    setBusy(true);
    try {
      const path = editingId ? `/api/messages/${editingId}` : `/api/conversations/${activeId}/messages`;
      const result = await api(path, { method: editingId ? 'PATCH' : 'POST', body: JSON.stringify({ content }) });
      upsertMessage(result);
      setMessage('');
      setEditingId('');
      if (messageInput.current) messageInput.current.style.height = '';
      setShowEmoji(false);
      setShowAttach(false);
    } catch (error) {
      showNotice(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function deleteMessage() {
    if (!pendingDelete) return;
    try {
      await api(`/api/messages/${pendingDelete.id}`, { method: 'DELETE' });
      reflectDeletedMessage(pendingDelete.id);
      setPendingDelete(null);
    } catch (error) {
      showNotice(error.message);
    }
  }

  async function toggleReaction(messageId, emoji) {
    try {
      const result = await api(`/api/messages/${messageId}/reactions`, { method: 'POST', body: JSON.stringify({ emoji }) });
      upsertMessage(result);
      setReactionFor('');
    } catch (error) {
      showNotice(error.message);
    }
  }

  async function openDirect(event) {
    event.preventDefault();
    setModalError('');
    const username = newContact.trim().replace(/^@/, '').split('#')[0].trim();
    if (!username) return;
    try {
      const conversation = await api('/api/conversations/direct', { method: 'POST', body: JSON.stringify({ username }) });
      setConversations((current) => [conversation, ...current.filter((item) => item.id !== conversation.id)]);
      setActiveId(conversation.id);
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
    const usernames = [...new Set(newContact.split(',').map((item) => item.trim().replace(/^@/, '').split('#')[0]).filter(Boolean))];
    if (!groupName.trim() || usernames.length === 0) {
      setModalError('Укажи название группы и имя хотя бы одного участника.');
      return;
    }
    try {
      const conversation = await api('/api/conversations/group', { method: 'POST', body: JSON.stringify({ name: groupName.trim(), usernames }) });
      setConversations((current) => [conversation, ...current]);
      setActiveId(conversation.id);
      setModal('');
      setGroupName('');
      setNewContact('');
    } catch (error) {
      setModalError(error.message);
    }
  }

  async function chooseUser(username) {
    setNewContact(username);
    setUserSearch(username);
    setGroupMode(false);
    setModalError('');
    try {
      const conversation = await api('/api/conversations/direct', { method: 'POST', body: JSON.stringify({ username }) });
      setConversations((current) => [conversation, ...current.filter((item) => item.id !== conversation.id)]);
      setActiveId(conversation.id);
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

  return (
    <main className="messenger">
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
              </button>
            );
          })}
          {!loading && !visibleChats.length && <div className="empty-chat-list">{search ? 'Чаты не найдены' : 'Чатов пока нет. Начни разговор!'}</div>}
        </div>
        <div className="sidebar-bottom"><button className="profile-button" onClick={() => setModal('profile')}><Avatar user={user} /><span className="profile-copy"><strong>{user.username}<small className="user-tag">#{user.tag}</small></strong><small><span className="tiny-dot" /> В сети</small></span><Icon name="more" size={18} /></button></div>
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
            <div className="messages-area">
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
                      <div className={`message-bubble ${item.deleted_at ? 'message-deleted' : ''}`}>{item.deleted_at ? 'Это сообщение удалено' : item.content}</div>
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
              {showAttach && <div className="popover attachment-popover"><button onClick={() => fileRef.current?.click()}><span className="popover-icon image-icon"><Icon name="image" size={17} /></span>Фото и видео <small>скоро</small></button><button onClick={() => fileRef.current?.click()}><span className="popover-icon file-icon"><Icon name="file" size={17} /></span>Файл с устройства <small>скоро</small></button><input ref={fileRef} type="file" hidden onChange={() => { showNotice('Загрузка файлов будет подключена следующим этапом.'); setShowAttach(false); }} /></div>}
              {showEmoji && <div className="popover emoji-popover">{reactionChoices.concat(['😊', '😂', '👋', '✨', '🥹', '🙌', '🤔', '😎']).map((emoji, index) => <button key={`${emoji}-${index}`} onClick={() => { setMessage((current) => `${current}${emoji}`); setShowEmoji(false); messageInput.current?.focus(); }}>{emoji}</button>)}</div>}
              <form className="composer" onSubmit={sendMessage}>
                <button type="button" className={`attach-button ${showAttach ? 'tool-active' : ''}`} onClick={() => { setShowAttach(!showAttach); setShowEmoji(false); }} aria-label="Прикрепить файл"><Icon name="plus" size={23} /></button>
                <div className="composer-input-wrap">
                  <textarea ref={messageInput} rows="1" value={message} onChange={(event) => { setMessage(event.target.value); event.currentTarget.style.height = 'auto'; event.currentTarget.style.height = `${Math.min(event.currentTarget.scrollHeight, 78)}px`; }} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} onFocus={() => { setShowAttach(false); setShowEmoji(false); }} placeholder={editingId ? 'Измени сообщение...' : 'Написать сообщение...'} aria-label="Сообщение" />
                  <button type="button" className={`emoji-button ${showEmoji ? 'tool-active' : ''}`} onClick={() => { setShowEmoji(!showEmoji); setShowAttach(false); }} aria-label="Выбрать эмодзи"><Icon name="smile" size={21} /></button>
                </div>
                {editingId && <button type="button" className="cancel-edit" onClick={() => { setEditingId(''); setMessage(''); }}>Отмена</button>}
                <button className="button button-primary send-button" type="submit" disabled={!message.trim() || busy}><span>{editingId ? 'Сохранить' : 'Отправить'}</span><Icon name="send" size={17} /></button>
              </form>
              <div className="composer-hint">Нажми <kbd>Enter</kbd>, чтобы отправить <span>·</span> <kbd>Shift + Enter</kbd>, чтобы перенести строку</div>
            </div>
          </>
        ) : (
          <div className="no-active-chat"><div className="brand-mark">o</div><h1>{loading ? 'Загружаем Otiscord…' : 'Добро пожаловать в Otiscord'}</h1><p>{loading ? 'Подключаем твои чаты' : 'Выбери разговор или найди собеседника, чтобы начать общение.'}</p>{!loading && <button className="button button-primary" onClick={() => setModal('contact')}><Icon name="plus" size={17} />Найти собеседника</button>}</div>
        )}
      </section>

      {modal === 'contact' && <Modal title={groupMode ? 'Создать группу' : 'Новый разговор'} onClose={() => { setModal(''); setModalError(''); setUserSearch(''); setNewContact(''); setGroupName(''); setGroupMode(false); }}><div className="modal-tabs"><button className={!groupMode ? 'modal-tab-active' : ''} onClick={() => { setGroupMode(false); setModalError(''); }}>Личное сообщение</button><button className={groupMode ? 'modal-tab-active' : ''} onClick={() => { setGroupMode(true); setModalError(''); }}>Групповой чат</button></div>{groupMode ? <form className="modal-form" onSubmit={createGroup}><label className="field-label">Название группы<input autoFocus value={groupName} onChange={(event) => setGroupName(event.target.value)} maxLength={80} placeholder="Например, Дизайн-команда" /></label><label className="field-label">Участники (имена через запятую)<input value={newContact} onChange={(event) => setNewContact(event.target.value)} placeholder="alex, maria" /></label><p className="modal-copy">Добавь точные имена пользователей, разделяя их запятыми.</p>{modalError && <p className="auth-error">{modalError}</p>}<button className="button button-primary modal-submit" type="submit"><Icon name="users" size={17} />Создать группу</button></form> : <><p className="modal-copy">Ищи по имени пользователя или тегу. Создадим личный чат.</p><label className="field-label">Имя пользователя<input autoFocus value={newContact || userSearch} onChange={(event) => { setNewContact(event.target.value); setUserSearch(event.target.value); }} placeholder="Например, Алексей" /></label>{userSearchResults.length > 0 && <div className="user-search-results">{userSearchResults.map((result) => <button key={result.id} onClick={() => chooseUser(result.username)}><Avatar user={result} /><span><strong>{result.username}</strong><small>#{result.tag}</small></span><Icon name="back" size={17} /></button>)}</div>}{modalError && <p className="auth-error">{modalError}</p>}<form className="modal-form" onSubmit={openDirect}><button className="button button-primary modal-submit" type="submit"><Icon name="search" size={17} />Найти и открыть чат</button></form><div className="modal-tip"><span className="sparkle">✳</span><span>Пользователь должен сначала создать аккаунт Otiscord.</span></div></>}</Modal>}
      {modal === 'profile' && <Modal title="Твой профиль" onClose={() => setModal('')}><div className="profile-modal-user"><Avatar user={user} large /><div><strong>{user.username}</strong><span>{user.username}#{user.tag}</span></div></div><div className="profile-settings-row"><span><Icon name="bell" size={18} />Аккаунт</span><span className="status-pill">Подключён</span></div><button className="button button-outline logout-button" onClick={logout}>Выйти из аккаунта</button></Modal>}
      {modal === 'details' && activeChat && <Modal title="Информация о чате" onClose={() => setModal('')}><div className="chat-details-user"><Avatar user={activeChat.kind === 'group' ? { username: activeChat.name, avatar_color: 'violet' } : activeChat.members.find((member) => member.id !== user.id) || user} large /><strong>{activeChat.name}</strong><span>{activeChat.kind === 'group' ? `Групповой чат · ${activeChat.members.length} участников` : activeChat.members.filter((member) => member.id !== user.id).map((member) => `${member.username}#${member.tag}`).join(', ')}</span></div><div className="profile-settings-row"><span><Icon name="users" size={18} />Участники</span><span className="status-pill">{activeChat.members.length}</span></div></Modal>}
      {pendingDelete && <Modal title="Удалить сообщение?" onClose={() => setPendingDelete(null)}><p className="modal-copy">Это удалит сообщение для всех участников чата. Отменить действие будет нельзя.</p><div className="confirm-actions"><button className="button button-outline" onClick={() => setPendingDelete(null)}>Отмена</button><button className="button button-danger" onClick={deleteMessage}>Удалить сообщение</button></div></Modal>}
      {notice && <div className="toast"><span className="tiny-dot" />{notice}</div>}
    </main>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [startupError, setStartupError] = useState('');
  const [checkingSession, setCheckingSession] = useState(Boolean(getToken()));
  useEffect(() => {
    const token = getToken();
    if (!token) return;
    api('/api/auth/me').then(setUser).catch((error) => {
      setStartupError(error.message);
      if (!getToken()) setUser(null);
    }).finally(() => setCheckingSession(false));
  }, []);
  if (checkingSession) return <main className="auth-screen"><div className="auth-brand">Otiscord</div></main>;
  return user ? <Messenger user={user} onLogout={() => setUser(null)} /> : <AuthScreen startupError={startupError} onAuthenticated={setUser} />;
}
