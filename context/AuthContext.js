'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const AuthContext = createContext({
  user: null,
  setUser: () => {},
  loading: true,
  logout: async () => {},
  authFetch: async () => {},
});

export function AuthProvider({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadEnquiries, setUnreadEnquiries] = useState(0);
  const [pendingArtisansCount, setPendingArtisansCount] = useState(0);

  const authFetch = useCallback(async (input, init = {}) => {
    const mergedInit = {
      credentials: 'include',
      ...init,
      headers: init.headers instanceof Headers ? init.headers : {
        ...(init.headers || {}),
      },
    };

    const response = await fetch(input, mergedInit);
    if (response.status === 401 || response.status === 403) {
      setUser(null);
      if (loading) {
        setLoading(false);
      }
    }
    return response;
  }, [loading]);

  // Patch browser fetch to ensure same-origin API requests send cookies
  useEffect(() => {
    if (typeof window === 'undefined' || window.__SCG_FETCH_PATCHED) return;

    const originalFetch = window.fetch.bind(window);
    window.fetch = async (input, init = {}) => {
      const requestUrl = typeof input === 'string' ? input : input.url;
      let isSameOrigin = false;

      try {
        const resolvedUrl = new URL(requestUrl, window.location.href);
        isSameOrigin = resolvedUrl.origin === window.location.origin;
      } catch (err) {
        isSameOrigin = false;
      }

      const mergedInit = {
        credentials: isSameOrigin ? 'include' : init.credentials || 'same-origin',
        ...init,
        headers: {
          ...(init?.headers || {}),
        },
      };

      return originalFetch(input, mergedInit);
    };

    window.__SCG_FETCH_PATCHED = true;
  }, []);

  // Fetch current user from /api/auth/me on mount
  useEffect(() => {
    async function fetchMe() {
      try {
        const response = await authFetch('/api/auth/me');
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            setUser(result.data);
          } else {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Error fetching authenticated user details:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    fetchMe();
  }, [authFetch]);

  // Fetch lightweight badge counts once after we have the user
  useEffect(() => {
    if (!user) return;

    const cached = (typeof window !== 'undefined' && window.__SCG_BADGES) ? window.__SCG_BADGES : null;
    if (cached) {
      const timer = setTimeout(() => {
        setUnreadNotifications(cached.unreadNotifications || 0);
        setUnreadEnquiries(cached.unreadEnquiries || 0);
        setPendingArtisansCount(cached.pendingArtisansCount || 0);
      }, 0);
      return () => clearTimeout(timer);
    }

    let mounted = true;
    async function fetchBadges() {
      try {
        let unreadNotifCount = 0;
        let unreadEnquiryCount = 0;
        let pendingCount = 0;

        const notifRes = await authFetch('/api/notifications?limit=10');
        if (notifRes.ok) {
          const notifJson = await notifRes.json();
          if (notifJson.success && notifJson.data && notifJson.data.notifications) {
            unreadNotifCount = notifJson.data.notifications.filter(n => !n.is_read).length;
          }
        }

        const enquiryRes = await authFetch('/api/enquiries?limit=10');
        if (enquiryRes.ok) {
          const enquiryJson = await enquiryRes.json();
          const items = Array.isArray(enquiryJson?.data)
            ? enquiryJson.data
            : Array.isArray(enquiryJson?.data?.enquiries)
              ? enquiryJson.data.enquiries
              : [];
          if (enquiryJson.success) {
            unreadEnquiryCount = items.filter(e => e?.status === 'pending').length;
          }
        }

        if (user.role === 'admin') {
          const pendingRes = await authFetch('/api/admin/pending-artisans?limit=10');
          if (pendingRes.ok) {
            const pendingJson = await pendingRes.json();
            if (pendingJson.success && pendingJson.data) {
              pendingCount = pendingJson.data.length;
            }
          }
        }

        if (mounted) {
          setUnreadNotifications(unreadNotifCount);
          setUnreadEnquiries(unreadEnquiryCount);
          setPendingArtisansCount(pendingCount);
        }

        if (typeof window !== 'undefined') {
          window.__SCG_BADGES = {
            unreadNotifications: unreadNotifCount,
            unreadEnquiries: unreadEnquiryCount,
            pendingArtisansCount: pendingCount,
          };
        }
      } catch (err) {
        console.error('Error fetching badge counts in AuthProvider:', err);
      }
    }

    fetchBadges();
    return () => { mounted = false; };
  }, [user, authFetch]);

  // Allow manual refresh of badge counts
  const refreshBadges = async () => {
    try {
      const notifRes = await authFetch('/api/notifications?limit=10');
      if (notifRes.ok) {
        const notifJson = await notifRes.json();
        if (notifJson.success && notifJson.data && notifJson.data.notifications) {
          setUnreadNotifications(notifJson.data.notifications.filter(n => !n.is_read).length);
        }
      }

      const enquiryRes = await authFetch('/api/enquiries?limit=10');
      if (enquiryRes.ok) {
        const enquiryJson = await enquiryRes.json();
        const items = Array.isArray(enquiryJson?.data)
          ? enquiryJson.data
          : Array.isArray(enquiryJson?.data?.enquiries)
            ? enquiryJson.data.enquiries
            : [];
        if (enquiryJson.success) setUnreadEnquiries(items.filter(e => e?.status === 'pending').length);
      }

      if (user?.role === 'admin') {
        const pendingRes = await authFetch('/api/admin/pending-artisans?limit=10');
        if (pendingRes.ok) {
          const pendingJson = await pendingRes.json();
          if (pendingJson.success && pendingJson.data) setPendingArtisansCount(pendingJson.data.length);
        }
      }

      if (typeof window !== 'undefined') {
        window.__SCG_BADGES = {
          unreadNotifications: unreadNotifications || 0,
          unreadEnquiries: unreadEnquiries || 0,
          pendingArtisansCount: pendingArtisansCount || 0,
        };
      }
    } catch (err) {
      console.error('Error refreshing badges:', err);
    }
  };

  // Logout method
  const logout = async () => {
    setUser(null);
    setLoading(true);
    router.replace('/');

    try {
      const response = await authFetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        console.error('Failed to logout of SkillsConnect session');
      }
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      setUser,
      loading,
      logout,
      authFetch,
      unreadNotifications,
      unreadEnquiries,
      pendingArtisansCount,
      refreshBadges,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
