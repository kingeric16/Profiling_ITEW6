import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  apiFetch,
  clearToken,
  fetchMe,
  getCachedUser,
  requestPasswordChangeOtp,
  verifyPasswordChangeOtp,
  syncCachedUser,
  updateMyProfile,
  uploadMyAvatar,
  type MeUser,
  type Role,
  type UpdateMyProfilePayload,
} from "./auth";

function maskEmail(email: string) {
  const at = email.indexOf("@");
  if (at < 1) return email;
  const user = email.slice(0, at);
  const domain = email.slice(at + 1);
  const show = user.slice(0, Math.min(2, user.length));
  return `${show}•••@${domain}`;
}

function initialsFromName(name: string) {
  return (name || "U")
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

type SidebarItem = { key: string; label: string; to: string; icon: string };

function roleToSidebar(role: Role): SidebarItem[] {
  if (role === "dean") {
    return [
      { key: "dashboard", label: "Dashboard", to: "/dean", icon: "▦" },
      { key: "students", label: "Students", to: "/dean/students", icon: "▣" },
      { key: "faculty", label: "Faculty", to: "/dean/faculty", icon: "✦" },
      {
        key: "curriculum",
        label: "Curriculum",
        to: "/dean/curriculum",
        icon: "☰",
      },
      {
        key: "scheduling",
        label: "Scheduling",
        to: "/dean/scheduling",
        icon: "⏱",
      },
      { key: "events", label: "Events", to: "/dean/events", icon: "◷" },
      { key: "reports", label: "Reports", to: "/dean/reports", icon: "⬚" },
    ];
  }
  if (role === "faculty") {
    return [
      { key: "dashboard", label: "Dashboard", to: "/faculty", icon: "▦" },
      {
        key: "classes",
        label: "My Classes",
        to: "/faculty/classes",
        icon: "▣",
      },
      {
        key: "students",
        label: "Students",
        to: "/faculty/students",
        icon: "✦",
      },
      { key: "grades", label: "Grade Entry", to: "/faculty/grades", icon: "⬚" },
      {
        key: "schedule",
        label: "Schedule",
        to: "/faculty/schedule",
        icon: "⏱",
      },
    ];
  }
  return [
    { key: "dashboard", label: "Dashboard", to: "/student", icon: "▦" },
    { key: "profile", label: "Profile", to: "/student/profile", icon: "▣" },
    { key: "subjects", label: "Subjects", to: "/student/subjects", icon: "✦" },
    { key: "schedule", label: "Schedule", to: "/student/schedule", icon: "⏱" },
    { key: "grades", label: "Grades", to: "/student/grades", icon: "◫" },
    { key: "events", label: "Events", to: "/student/events", icon: "◷" },
    { key: "skills", label: "Skills", to: "/student/skills", icon: "⬚" },
  ];
}

export function DashboardLayout({
  activeKey,
  title,
  children,
}: {
  activeKey: string;
  title: string;
  children: React.ReactNode;
}) {
  const navigate = useNavigate();
  const [me, setMe] = useState<MeUser | null>(() => getCachedUser());
  const [q, setQ] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState<{
    students: any[];
    faculty: any[];
    subjects: any[];
  } | null>(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [updateProfileOpen, setUpdateProfileOpen] = useState(false);
  const [profilePickPreview, setProfilePickPreview] = useState<string | null>(
    null,
  );
  const [profilePickFile, setProfilePickFile] = useState<File | null>(null);
  const [profileName, setProfileName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordUnlocked, setPasswordUnlocked] = useState(false);
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [otpModalCode, setOtpModalCode] = useState("");
  const [otpModalError, setOtpModalError] = useState<string | null>(null);
  const [otpVerifyLoading, setOtpVerifyLoading] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileUploadError, setProfileUploadError] = useState<string | null>(
    null,
  );
  const notifWrapRef = useRef<HTMLDivElement>(null);
  const profileWrapRef = useRef<HTMLDivElement>(null);
  const profileFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchMe().then((m) => {
      if (m?.user) setMe(m.user);
    });
  }, []);

  useEffect(() => {
    if (!notifOpen && !profileMenuOpen) return;
    function onDocMouseDown(e: MouseEvent) {
      const t = e.target as Node;
      if (notifWrapRef.current?.contains(t)) return;
      if (profileWrapRef.current?.contains(t)) return;
      setNotifOpen(false);
      setProfileMenuOpen(false);
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [notifOpen, profileMenuOpen]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      if (otpModalOpen) {
        setOtpModalOpen(false);
        setOtpModalError(null);
        return;
      }
      if (updateProfileOpen) {
        setUpdateProfileOpen(false);
        return;
      }
      setNotifOpen(false);
      setProfileMenuOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [updateProfileOpen, otpModalOpen]);

  useEffect(() => {
    if (updateProfileOpen) return;
    setProfilePickFile(null);
    setProfileUploadError(null);
    setProfileName("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordUnlocked(false);
    setOtpModalOpen(false);
    setOtpModalCode("");
    setOtpModalError(null);
    setOtpCooldown(0);
    setProfilePickPreview((prev) => {
      if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
      return null;
    });
    if (profileFileInputRef.current) profileFileInputRef.current.value = "";
  }, [updateProfileOpen]);

  function openUpdateProfileModal() {
    setProfileMenuOpen(false);
    if (me) setProfileName(me.name);
    setNewPassword("");
    setConfirmPassword("");
    setPasswordUnlocked(false);
    setOtpModalOpen(false);
    setOtpModalCode("");
    setOtpModalError(null);
    setOtpCooldown(0);
    setProfileUploadError(null);
    setUpdateProfileOpen(true);
  }

  useEffect(() => {
    if (otpCooldown <= 0) return;
    const t = window.setInterval(
      () => setOtpCooldown((c) => Math.max(0, c - 1)),
      1000,
    );
    return () => window.clearInterval(t);
  }, [otpCooldown]);

  async function sendPasswordOtp() {
    setOtpSending(true);
    setProfileUploadError(null);
    try {
      await requestPasswordChangeOtp();
      setOtpCooldown(60);
      setOtpModalCode("");
      setOtpModalError(null);
      setOtpModalOpen(true);
    } catch (err) {
      const e = err as Error & { retryAfter?: number };
      if (typeof e.retryAfter === "number")
        setOtpCooldown(Math.max(1, Math.ceil(e.retryAfter)));
      setProfileUploadError(e.message || "Could not send code");
    } finally {
      setOtpSending(false);
    }
  }

  async function submitOtpVerification() {
    const digits = otpModalCode.replace(/\D/g, "");
    if (digits.length !== 6) {
      setOtpModalError("Enter the 6-digit code from your email.");
      return;
    }
    setOtpVerifyLoading(true);
    setOtpModalError(null);
    try {
      await verifyPasswordChangeOtp(digits);
      setPasswordUnlocked(true);
      setOtpModalOpen(false);
      setOtpModalCode("");
    } catch (err) {
      setOtpModalError(
        err instanceof Error ? err.message : "Verification failed",
      );
    } finally {
      setOtpVerifyLoading(false);
    }
  }

  async function saveProfile() {
    if (!me) return;
    const nameTrim = profileName.trim();
    const nameChanged = nameTrim !== me.name.trim();
    const pwChange = newPassword.length > 0;
    const photoChange = !!profilePickFile;

    if (!nameChanged && !pwChange && !photoChange) {
      setProfileUploadError("No changes to save.");
      return;
    }

    if (!nameTrim) {
      setProfileUploadError("Please enter your name.");
      return;
    }

    if (pwChange) {
      if (!passwordUnlocked) {
        setProfileUploadError(
          "Verify your email with the code we sent before setting a new password.",
        );
        return;
      }
      if (newPassword.length < 8) {
        setProfileUploadError("New password must be at least 8 characters.");
        return;
      }
      if (newPassword !== confirmPassword) {
        setProfileUploadError("New password and confirmation do not match.");
        return;
      }
    }

    setProfileSaving(true);
    setProfileUploadError(null);
    try {
      let latest: MeUser = me;

      if (nameChanged || pwChange) {
        const body: UpdateMyProfilePayload = { name: nameTrim };
        if (pwChange) {
          body.password = newPassword;
          body.password_confirmation = confirmPassword;
        }
        latest = await updateMyProfile(body);
        setMe(latest);
        syncCachedUser(latest);
      }

      if (profilePickFile) {
        latest = await uploadMyAvatar(profilePickFile);
        setMe(latest);
        syncCachedUser(latest);
      }

      setUpdateProfileOpen(false);
    } catch (err) {
      setProfileUploadError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setProfileSaving(false);
    }
  }

  function onProfileFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setProfilePickPreview((prev) => {
      if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    setProfilePickFile(file);
    setProfileUploadError(null);
  }

  async function handleLogout() {
    try {
      await apiFetch("/api/logout", { method: "POST" });
    } finally {
      clearToken();
      setProfileMenuOpen(false);
      navigate("/login", { replace: true });
    }
  }

  const sidebar = useMemo(() => (me ? roleToSidebar(me.role) : []), [me]);

  useEffect(() => {
    if (!q.trim()) {
      setSearch(null);
      return;
    }
    const t = setTimeout(async () => {
      const res = await apiFetch(
        `/api/search?q=${encodeURIComponent(q.trim())}`,
      );
      if (!res.ok) return;
      setSearch((await res.json()) as any);
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand brand-only">
          <img className="brand-image" src="/logo.png" alt="CCS logo" />
          <span className="brand-college">College Computing Studies</span>
        </div>

        <nav className="nav">
          <div className="nav-label">Menu</div>
          {sidebar.map((item) => (
            <Link
              key={item.key}
              to={item.to}
              className={[
                "nav-item",
                activeKey === item.key ? "active" : "",
              ].join(" ")}
            >
              <span className="nav-icon" aria-hidden="true">
                {item.icon}
              </span>
              <span className="nav-title">{item.label}</span>
              <span className="nav-pill-dot" />
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-profile">
            <div
              className={[
                "sidebar-profile-avatar",
                me?.avatar_url ? "sidebar-profile-avatar--photo" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              aria-hidden="true"
            >
              {me?.avatar_url ? (
                <img src={me.avatar_url} alt="" />
              ) : (
                initialsFromName(me?.name ?? "")
              )}
            </div>
            <div className="sidebar-profile-meta">
              <div className="sidebar-profile-name">{me?.name ?? "—"}</div>
              <div className="sidebar-profile-sub">{me?.role ?? "—"}</div>
            </div>
          </div>

          <button
            type="button"
            className="sidebar-logout"
            onClick={() => void handleLogout()}
          >
            Log out
          </button>
        </div>
      </aside>

      <main className="main">
        <header className="main-header">
          <div className="page-title-block">
            <div className="page-greeting">Welcome, {me?.name ?? "…"}</div>
            <div className="page-title">{title}</div>
          </div>

          <div className="search-role-row" style={{ position: "relative" }}>
            <div className="search-input">
              <span className="search-input-icon" aria-hidden="true">
                ⌕
              </span>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onFocus={() => setSearchOpen(true)}
                onBlur={() => setTimeout(() => setSearchOpen(false), 150)}
                placeholder="Search student, faculty, subject..."
              />
            </div>

            {searchOpen && q.trim() && search ? (
              <div className="search-popover">
                <div className="search-popover-grid">
                  <div>
                    <div style={{ fontWeight: 700, marginBottom: 6 }}>
                      Students
                    </div>
                    {(search.students || []).slice(0, 5).map((s: any) => (
                      <div key={s.student_id} className="search-popover-card">
                        <div className="search-popover-title">
                          {(s.last_name || "") + ", " + (s.first_name || "")}
                        </div>
                        <div className="search-popover-sub">
                          {s.student_number || ""}
                        </div>
                      </div>
                    ))}
                    {!search.students?.length ? (
                      <div style={{ color: "#6b7280" }}>No matches</div>
                    ) : null}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, marginBottom: 6 }}>
                      Faculty
                    </div>
                    {(search.faculty || []).slice(0, 5).map((f: any) => (
                      <div key={f.faculty_id} className="search-popover-card">
                        <div className="search-popover-title">
                          {(f.last_name || "") + ", " + (f.first_name || "")}
                        </div>
                        <div className="search-popover-sub">
                          {f.department || ""}
                        </div>
                      </div>
                    ))}
                    {!search.faculty?.length ? (
                      <div style={{ color: "#6b7280" }}>No matches</div>
                    ) : null}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, marginBottom: 6 }}>
                      Subjects
                    </div>
                    {(search.subjects || []).slice(0, 5).map((s: any) => (
                      <div key={s.subject_id} className="search-popover-card">
                        <div className="search-popover-title">
                          {s.subject_code || ""}
                        </div>
                        <div className="search-popover-sub">
                          {s.subject_name || ""}
                        </div>
                      </div>
                    ))}
                    {!search.subjects?.length ? (
                      <div style={{ color: "#6b7280" }}>No matches</div>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : null}

            <div className="header-actions">
              <div className="header-notif-wrap" ref={notifWrapRef}>
                <button
                  type="button"
                  className="header-icon-btn"
                  aria-label="Notifications"
                  aria-expanded={notifOpen}
                  onClick={() => {
                    setNotifOpen((v) => !v);
                    setProfileMenuOpen(false);
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M12 22C13.1 22 14 21.1 14 20H10C10 21.1 10.9 22 12 22ZM18 16V11C18 7.93 16.37 5.36 13.5 4.68V4C13.5 3.17 12.83 2.5 12 2.5C11.17 2.5 10.5 3.17 10.5 4V4.68C7.64 5.36 6 7.92 6 11V16L4 18V19H20V18L18 16Z"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                {notifOpen ? (
                  <div
                    className="header-dropdown header-dropdown--notif"
                    role="dialog"
                    aria-label="Notifications"
                  >
                    <p className="header-dropdown-empty">
                      No new notifications
                    </p>
                  </div>
                ) : null}
              </div>

              <div className="header-profile-wrap" ref={profileWrapRef}>
                <button
                  type="button"
                  className="profile-strip profile-strip--trigger"
                  aria-label="Account menu"
                  aria-expanded={profileMenuOpen}
                  aria-haspopup="menu"
                  onClick={() => {
                    setProfileMenuOpen((v) => !v);
                    setNotifOpen(false);
                  }}
                >
                  <div
                    className={["avatar", me?.avatar_url ? "avatar--photo" : ""]
                      .filter(Boolean)
                      .join(" ")}
                    aria-hidden="true"
                  >
                    {me?.avatar_url ? (
                      <img src={me.avatar_url} alt="" />
                    ) : (
                      initialsFromName(me?.name ?? "")
                    )}
                  </div>
                  <div className="profile-meta">
                    <div className="profile-name">{me?.name ?? "—"}</div>
                    <div className="profile-role">{me?.role ?? "—"}</div>
                  </div>
                  <span className="profile-chevron" aria-hidden="true">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M6 9L12 15L18 9"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </button>
                {profileMenuOpen ? (
                  <div
                    className="header-dropdown header-dropdown--menu"
                    role="menu"
                  >
                    <button
                      type="button"
                      className="header-dropdown-item"
                      role="menuitem"
                      onClick={openUpdateProfileModal}
                    >
                      Update profile
                    </button>
                    <button
                      type="button"
                      className="header-dropdown-item header-dropdown-item--danger"
                      role="menuitem"
                      onClick={() => void handleLogout()}
                    >
                      Log out
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </header>

        <section className="layout">{children}</section>
      </main>

      {updateProfileOpen
        ? createPortal(
            <div
              className="modal-overlay"
              role="presentation"
              onMouseDown={(e) => {
                if (otpModalOpen) return;
                if (e.target === e.currentTarget) setUpdateProfileOpen(false);
              }}
            >
              <div
                className="modal-card modal-card--profile"
                role="dialog"
                aria-modal="true"
                aria-labelledby="update-profile-modal-title"
                onMouseDown={(e) => e.stopPropagation()}
              >
                <div className="profile-modal-header">
                  <h2 id="update-profile-modal-title" className="modal-title">
                    Update profile
                  </h2>
                  <p className="modal-subtitle">
                    Update your name and photo anytime. To change your password,
                    verify your email with a one-time code first.
                  </p>
                </div>

                <div className="profile-modal-body">
                  <div className="profile-modal-aside">
                    <div className="profile-modal-aside-label">
                      Profile photo
                    </div>
                    <div
                      className={[
                        "profile-modal-preview",
                        profilePickPreview || me?.avatar_url
                          ? "profile-modal-preview--photo"
                          : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      {profilePickPreview || me?.avatar_url ? (
                        <img
                          src={profilePickPreview || me?.avatar_url || ""}
                          alt=""
                        />
                      ) : (
                        <span className="profile-modal-preview-initials">
                          {initialsFromName(profileName || me?.name || "")}
                        </span>
                      )}
                    </div>
                    <input
                      ref={profileFileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      className="profile-modal-file-input"
                      onChange={onProfileFileChange}
                    />
                    <button
                      type="button"
                      className="profile-modal-browse"
                      onClick={() => profileFileInputRef.current?.click()}
                    >
                      Choose image
                    </button>
                  </div>

                  <div className="profile-modal-fields">
                    <label className="profile-modal-field">
                      <span className="profile-modal-label">Full name</span>
                      <input
                        type="text"
                        className="profile-modal-input"
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        autoComplete="name"
                        maxLength={255}
                      />
                    </label>

                    <div className="profile-modal-section-label">Password</div>
                    {!passwordUnlocked ? (
                      <div className="profile-password-lock">
                        <div className="profile-password-lock-inner">
                          <div
                            className="profile-password-lock-icon"
                            aria-hidden="true"
                          >
                            <svg
                              width="28"
                              height="28"
                              viewBox="0 0 24 24"
                              fill="none"
                            >
                              <path
                                d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"
                                stroke="currentColor"
                                strokeWidth="1.75"
                              />
                              <path
                                d="M5 11C5 7.13401 8.13401 4 12 4C15.866 4 19 7.13401 19 11V11M5 11V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V11M5 11H5.01M19 11H19.01"
                                stroke="currentColor"
                                strokeWidth="1.75"
                                strokeLinecap="round"
                              />
                            </svg>
                          </div>
                          <div>
                            <p className="profile-password-lock-title">
                              Password change is locked
                            </p>
                            <p className="profile-password-lock-text">
                              We will send a verification code to{" "}
                              <strong>
                                {me?.email ? maskEmail(me.email) : "your email"}
                              </strong>
                              . Enter it in the next step to unlock new password
                              fields.
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="profile-modal-send-otp"
                          disabled={otpSending || otpCooldown > 0 || !me?.email}
                          onClick={() => void sendPasswordOtp()}
                        >
                          {otpSending
                            ? "Sending…"
                            : otpCooldown > 0
                              ? `Resend in ${otpCooldown}s`
                              : "Send verification code"}
                        </button>
                      </div>
                    ) : (
                      <div className="profile-password-unlocked">
                        <p className="profile-modal-success profile-modal-success--inline">
                          Email verified — you can set a new password.
                        </p>
                        <label className="profile-modal-field">
                          <span className="profile-modal-label">
                            New password
                          </span>
                          <input
                            type="password"
                            className="profile-modal-input"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            autoComplete="new-password"
                            placeholder="At least 8 characters"
                          />
                        </label>
                        <label className="profile-modal-field">
                          <span className="profile-modal-label">
                            Confirm new password
                          </span>
                          <input
                            type="password"
                            className="profile-modal-input"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            autoComplete="new-password"
                          />
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                {profileUploadError ? (
                  <div className="profile-modal-error">
                    {profileUploadError}
                  </div>
                ) : null}

                <div className="modal-actions">
                  <button
                    type="button"
                    className="modal-btn modal-btn--ghost"
                    onClick={() => setUpdateProfileOpen(false)}
                    disabled={profileSaving}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="modal-btn modal-btn--primary"
                    disabled={profileSaving}
                    onClick={() => void saveProfile()}
                  >
                    {profileSaving ? "Saving…" : "Save changes"}
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}

      {otpModalOpen && me
        ? createPortal(
            <div
              className="modal-overlay modal-overlay--otp"
              role="presentation"
              onMouseDown={(e) => {
                if (e.target === e.currentTarget) {
                  setOtpModalOpen(false);
                  setOtpModalError(null);
                }
              }}
            >
              <div
                className="modal-card modal-card--otp-verify"
                role="dialog"
                aria-modal="true"
                aria-labelledby="otp-modal-title"
                onMouseDown={(e) => e.stopPropagation()}
              >
                <h2 id="otp-modal-title" className="modal-title">
                  Verify your email
                </h2>
                <p className="modal-subtitle modal-subtitle--otp">
                  Enter the 6-digit code we sent to{" "}
                  <strong>{maskEmail(me.email)}</strong>.
                </p>
                <label className="profile-modal-field">
                  <span className="profile-modal-label">Verification code</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    className="profile-modal-input profile-modal-input--otp"
                    value={otpModalCode}
                    onChange={(e) =>
                      setOtpModalCode(
                        e.target.value.replace(/\D/g, "").slice(0, 6),
                      )
                    }
                    placeholder="• • • • • •"
                    maxLength={6}
                    autoFocus
                  />
                </label>
                {otpModalError ? (
                  <div className="profile-modal-error">{otpModalError}</div>
                ) : null}
                <p className="otp-modal-resend">
                  <button
                    type="button"
                    className="otp-modal-resend-btn"
                    disabled={otpSending || otpCooldown > 0}
                    onClick={() => void sendPasswordOtp()}
                  >
                    {otpCooldown > 0
                      ? `Resend code in ${otpCooldown}s`
                      : "Resend code"}
                  </button>
                </p>
                <div className="modal-actions">
                  <button
                    type="button"
                    className="modal-btn modal-btn--ghost"
                    onClick={() => {
                      setOtpModalOpen(false);
                      setOtpModalError(null);
                    }}
                    disabled={otpVerifyLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="modal-btn modal-btn--primary"
                    disabled={
                      otpVerifyLoading ||
                      otpModalCode.replace(/\D/g, "").length !== 6
                    }
                    onClick={() => void submitOtpVerification()}
                  >
                    {otpVerifyLoading ? "Verifying…" : "Confirm code"}
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
