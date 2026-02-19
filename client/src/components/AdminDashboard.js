import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
    Users, Shield, UserCheck, UserX, Search,
    ChevronLeft, ChevronRight, AlertTriangle, CheckCircle,
    XCircle, Trash2, Flag, Eye, BarChart3, MapPin,
    Clock, RefreshCw, User, Briefcase, Leaf
} from 'lucide-react';

const API = process.env.REACT_APP_API_URL || '';

const translations = {
    en: {
        title: 'Admin Dashboard',
        subtitle: 'User Management & Officer Approval',
        overview: 'Overview',
        users: 'Users',
        approvals: 'Officer Approvals',
        flagged: 'Flagged Accounts',
        totalUsers: 'Total Users',
        farmers: 'Farmers',
        officers: 'Officers',
        buyers: 'Buyers',
        pendingApprovals: 'Pending Approvals',
        flaggedAccounts: 'Flagged Accounts',
        recentSignups: 'Recent Signups (7d)',
        searchPlaceholder: 'Search by name, username, email...',
        allRoles: 'All Roles',
        allDistricts: 'All Districts',
        allStatuses: 'All Statuses',
        active: 'Active',
        pending: 'Pending',
        approve: 'Approve',
        reject: 'Reject',
        delete: 'Delete',
        flag: 'Flag',
        unflag: 'Unflag',
        viewDetails: 'View Details',
        confirmDelete: 'Are you sure you want to delete this user?',
        rejectionReason: 'Reason for rejection',
        noUsers: 'No users found',
        noPending: 'No pending officer approvals',
        noFlagged: 'No flagged accounts',
        loading: 'Loading...',
        error: 'Error loading data',
        retry: 'Retry',
        role: 'Role',
        district: 'District',
        status: 'Status',
        joined: 'Joined',
        email: 'Email',
        phone: 'Phone',
        officerId: 'Officer ID',
        department: 'Department',
        designation: 'Designation',
        approvalStatus: 'Approval Status',
        actions: 'Actions',
        page: 'Page',
        of: 'of',
        showing: 'Showing',
        topDistricts: 'Top Districts',
        changeRole: 'Change Role',
        credits: 'Credits',
        dailyLimit: 'Daily Limit',
        updateCredits: 'Update Credits',
    },
    si: {
        title: 'පරිපාලක උපකරණ පුවරුව',
        subtitle: 'පරිශීලක කළමනාකරණය සහ නිලධාරී අනුමත කිරීම',
        overview: 'දළ විශ්ලේෂණය',
        users: 'පරිශීලකයන්',
        approvals: 'නිලධාරී අනුමැතිය',
        flagged: 'ධජිත ගිණුම්',
        totalUsers: 'මුළු පරිශීලකයන්',
        farmers: 'ගොවීන්',
        officers: 'නිලධාරීන්',
        buyers: 'ගැණුම්කරුවන්',
        pendingApprovals: 'බලාපොරොත්තු අනුමැතිය',
        flaggedAccounts: 'ධජිත ගිණුම්',
        recentSignups: 'මෑත ලියාපදිංචි (දින 7)',
        searchPlaceholder: 'නම, පරිශීලක නාමය, ඊමේල් මගින් සොයන්න...',
        allRoles: 'සියලු භූමිකාවන්',
        allDistricts: 'සියලු දිස්ත්‍රික්ක',
        allStatuses: 'සියලු තත්‍ව',
        active: 'සක්‍රිය',
        pending: 'බලාපොරොත්තු',
        approve: 'අනුමත කරන්න',
        reject: 'ප්‍රතික්ෂේප',
        delete: 'මකන්න',
        flag: 'ධජනය',
        unflag: 'ධජනය ඉවත් කරන්න',
        viewDetails: 'විස්තර බලන්න',
        confirmDelete: 'මෙම පරිශීලකයා මැකීමට ඔබට අවශ්‍ය ද?',
        rejectionReason: 'ප්‍රතික්ෂේප කිරීමේ හේතුව',
        noUsers: 'පරිශීලකයන් හමු නොවීය',
        noPending: 'බලාපොරොත්තු නිලධාරී අනුමැතිය නැත',
        noFlagged: 'ධජිත ගිණුම් නැත',
        loading: 'පූරණය වෙමින්...',
        error: 'දත්ත පූරණය කිරීමේ දෝෂයක්',
        retry: 'නැවත උත්සාහ කරන්න',
        role: 'භූමිකාව',
        district: 'දිස්ත්‍රික්කය',
        status: 'තත්‍වය',
        joined: 'එක් වූ දිනය',
        email: 'ඊමේල්',
        phone: 'දුරකථනය',
        officerId: 'නිලධාරී හැඳුනුම්පත',
        department: 'දෙපාර්තමේන්තුව',
        designation: 'තනතුර',
        approvalStatus: 'අනුමත තත්‍වය',
        actions: 'ක්‍රියා',
        page: 'පිටුව',
        of: 'න්',
        showing: 'පෙන්වමින්',
        topDistricts: 'ප්‍රමුඛ දිස්ත්‍රික්ක',
        changeRole: 'භූමිකාව වෙනස් කරන්න',
        credits: 'ණය',
        dailyLimit: 'දෛනික සීමාව',
        updateCredits: 'ණය යාවත්කාලීන කරන්න',
    }
};

const roleConfig = {
    farmer: { label: 'Farmer', labelSi: 'ගොවියා', icon: Leaf, color: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
    officer: { label: 'Officer', labelSi: 'නිලධාරියා', icon: Shield, color: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
    buyer: { label: 'Buyer', labelSi: 'ගැණුම්කරු', icon: Briefcase, color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
    admin: { label: 'Admin', labelSi: 'පරිපාලක', icon: Shield, color: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
    moderator: { label: 'Moderator', labelSi: 'මධ්‍යස්ථ', icon: Eye, color: 'bg-purple-100 text-purple-700', dot: 'bg-purple-500' }
};

const AdminDashboard = ({ user, language = 'en' }) => {
    const t = translations[language] || translations.en;
    const [activeTab, setActiveTab] = useState('overview');
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [pendingOfficers, setPendingOfficers] = useState([]);
    const [flaggedUsers, setFlaggedUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [districtFilter, setDistrictFilter] = useState('all');
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalCount: 0 });
    const [districts, setDistricts] = useState([]);
    const [rejectionModal, setRejectionModal] = useState(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [actionLoading, setActionLoading] = useState(null);

    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    // Fetch stats
    const fetchStats = useCallback(async () => {
        try {
            const res = await axios.get(`${API}/api/admin/stats`, { headers });
            setStats(res.data.stats);
        } catch (err) {
            console.error('Stats error:', err);
        }
    }, []);

    // Fetch users
    const fetchUsers = useCallback(async (page = 1) => {
        try {
            setLoading(true);
            const params = { page, limit: 15 };
            if (searchTerm) params.search = searchTerm;
            if (roleFilter !== 'all') params.role = roleFilter;
            if (districtFilter !== 'all') params.district = districtFilter;

            const res = await axios.get(`${API}/api/admin/users`, { headers, params });
            setUsers(res.data.users);
            setPagination(res.data.pagination);
        } catch (err) {
            setError(t.error);
        } finally {
            setLoading(false);
        }
    }, [searchTerm, roleFilter, districtFilter]);

    // Fetch pending officers
    const fetchPendingOfficers = useCallback(async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API}/api/admin/pending-officers`, { headers });
            setPendingOfficers(res.data.officers);
        } catch (err) {
            setError(t.error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch flagged users
    const fetchFlaggedUsers = useCallback(async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API}/api/admin/users`, { headers, params: { status: 'flagged', limit: 50 } });
            setFlaggedUsers(res.data.users);
        } catch (err) {
            setError(t.error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch districts
    const fetchDistricts = useCallback(async () => {
        try {
            const res = await axios.get(`${API}/api/admin/districts`, { headers });
            setDistricts(res.data.districts);
        } catch (err) {
            console.error('Districts error:', err);
        }
    }, []);

    useEffect(() => {
        fetchStats();
        fetchDistricts();
    }, []);

    useEffect(() => {
        if (activeTab === 'users') fetchUsers(1);
        else if (activeTab === 'approvals') fetchPendingOfficers();
        else if (activeTab === 'flagged') fetchFlaggedUsers();
    }, [activeTab]);

    useEffect(() => {
        if (activeTab === 'users') {
            const timer = setTimeout(() => fetchUsers(1), 300);
            return () => clearTimeout(timer);
        }
    }, [searchTerm, roleFilter, districtFilter]);

    // Actions
    const approveOfficer = async (id) => {
        try {
            setActionLoading(id);
            await axios.put(`${API}/api/admin/officers/${id}/approve`, {}, { headers });
            setPendingOfficers(prev => prev.filter(o => o._id !== id));
            fetchStats();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to approve');
        } finally {
            setActionLoading(null);
        }
    };

    const rejectOfficer = async () => {
        if (!rejectionModal || !rejectionReason.trim()) return;
        try {
            setActionLoading(rejectionModal);
            await axios.put(`${API}/api/admin/officers/${rejectionModal}/reject`, { reason: rejectionReason }, { headers });
            setPendingOfficers(prev => prev.filter(o => o._id !== rejectionModal));
            setRejectionModal(null);
            setRejectionReason('');
            fetchStats();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to reject');
        } finally {
            setActionLoading(null);
        }
    };

    const toggleFlag = async (id, currently) => {
        try {
            setActionLoading(id);
            await axios.put(`${API}/api/admin/users/${id}/status`, { flagged: !currently }, { headers });
            if (activeTab === 'users') fetchUsers(pagination.page);
            if (activeTab === 'flagged') fetchFlaggedUsers();
            fetchStats();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to update');
        } finally {
            setActionLoading(null);
        }
    };

    const deleteUser = async (id, username) => {
        if (!window.confirm(`${t.confirmDelete}\n\nUser: ${username}`)) return;
        try {
            setActionLoading(id);
            await axios.delete(`${API}/api/admin/users/${id}`, { headers });
            if (activeTab === 'users') fetchUsers(pagination.page);
            if (activeTab === 'flagged') fetchFlaggedUsers();
            fetchStats();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to delete');
        } finally {
            setActionLoading(null);
        }
    };

    const changeRole = async (id, newRole) => {
        try {
            setActionLoading(id);
            await axios.put(`${API}/api/admin/users/${id}/role`, { role: newRole }, { headers });
            fetchUsers(pagination.page);
            fetchStats();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to change role');
        } finally {
            setActionLoading(null);
        }
    };

    const updateCredits = async (id, credits, dailyLimit, isPremium) => {
        try {
            setActionLoading(id);
            await axios.put(`${API}/api/admin/users/${id}/credits`, {
                credits: Number(credits),
                dailyLimit: Number(dailyLimit),
                isPremium: Boolean(isPremium)
            }, { headers });

            if (activeTab === 'users') fetchUsers(pagination.page);
            fetchStats();

            if (selectedUser && selectedUser._id === id) {
                setSelectedUser(prev => ({
                    ...prev,
                    credits: Number(credits),
                    dailyLimit: Number(dailyLimit),
                    isPremium: Boolean(isPremium)
                }));
            }
            alert('Credits updated');
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to update credits');
        } finally {
            setActionLoading(null);
        }
    };

    // Tabs config
    const tabs = [
        { id: 'overview', label: t.overview, icon: BarChart3 },
        { id: 'users', label: t.users, icon: Users },
        { id: 'approvals', label: t.approvals, icon: UserCheck, badge: stats?.pendingOfficers },
        { id: 'flagged', label: t.flagged, icon: AlertTriangle, badge: stats?.flaggedAccounts },
    ];

    const formatDate = (d) => {
        if (!d) return '—';
        return new Date(d).toLocaleDateString(language === 'si' ? 'si-LK' : 'en-LK', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    };

    const RoleBadge = ({ role: r }) => {
        const cfg = roleConfig[r] || roleConfig.farmer;
        return (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                {language === 'si' ? cfg.labelSi : cfg.label}
            </span>
        );
    };

    // ==================== OVERVIEW TAB ====================
    const OverviewTab = () => {
        if (!stats) return <LoadingState />;

        const cards = [
            { label: t.totalUsers, value: stats.totalUsers, icon: Users, color: 'from-slate-500 to-slate-700' },
            { label: t.farmers, value: stats.totalFarmers, icon: Leaf, color: 'from-green-500 to-green-700' },
            { label: t.officers, value: stats.totalOfficers, icon: Shield, color: 'from-blue-500 to-blue-700' },
            { label: t.buyers, value: stats.totalBuyers, icon: Briefcase, color: 'from-amber-500 to-amber-700' },
            { label: t.pendingApprovals, value: stats.pendingOfficers, icon: Clock, color: 'from-orange-500 to-orange-700', highlight: stats.pendingOfficers > 0 },
            { label: t.flaggedAccounts, value: stats.flaggedAccounts, icon: AlertTriangle, color: 'from-red-500 to-red-700', highlight: stats.flaggedAccounts > 0 },
            { label: t.recentSignups, value: stats.recentUsers, icon: UserCheck, color: 'from-teal-500 to-teal-700' },
        ];

        return (
            <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                    {cards.map((card, i) => {
                        const Icon = card.icon;
                        return (
                            <div
                                key={i}
                                className={`relative overflow-hidden rounded-xl p-4 md:p-5 text-white shadow-lg transition-transform hover:scale-[1.02] ${card.highlight ? 'ring-2 ring-offset-2 ring-orange-400' : ''}`}
                                style={{ background: `linear-gradient(135deg, var(--tw-gradient-stops))` }}
                            >
                                <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-100`} />
                                <div className="relative z-10">
                                    <div className="flex items-center justify-between mb-2">
                                        <Icon className="w-5 h-5 md:w-6 md:h-6 opacity-80" />
                                        {card.highlight && <span className="w-2 h-2 bg-white rounded-full animate-pulse" />}
                                    </div>
                                    <p className="text-2xl md:text-3xl font-black">{card.value}</p>
                                    <p className="text-xs md:text-sm opacity-80 mt-0.5 font-medium">{card.label}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Top Districts */}
                {stats.districtBreakdown?.length > 0 && (
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200 p-4 md:p-6 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-indigo-500" />
                            {t.topDistricts}
                        </h3>
                        <div className="space-y-2">
                            {stats.districtBreakdown.map((d, i) => {
                                const maxCount = stats.districtBreakdown[0]?.count || 1;
                                const pct = Math.round((d.count / maxCount) * 100);
                                return (
                                    <div key={i} className="flex items-center gap-3">
                                        <span className="w-28 md:w-36 text-sm font-medium text-slate-700 truncate">{d._id || 'Unknown'}</span>
                                        <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-indigo-400 to-indigo-600 rounded-full transition-all duration-700 flex items-center justify-end pr-2"
                                                style={{ width: `${Math.max(pct, 8)}%` }}
                                            >
                                                <span className="text-[10px] font-bold text-white">{d.count}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // ==================== USERS TAB ====================
    const UsersTab = () => (
        <div className="space-y-4">
            {/* Search & Filters */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200 p-3 md:p-4 shadow-sm">
                <div className="flex flex-col md:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder={t.searchPlaceholder}
                            className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                    </div>
                    <div className="flex gap-2">
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="all">{t.allRoles}</option>
                            <option value="farmer">{t.farmers}</option>
                            <option value="officer">{t.officers}</option>
                            <option value="buyer">{t.buyers}</option>
                            <option value="admin">Admin</option>
                        </select>
                        <select
                            value={districtFilter}
                            onChange={(e) => setDistrictFilter(e.target.value)}
                            className="px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="all">{t.allDistricts}</option>
                            {districts.map(d => (
                                <option key={d.name} value={d.name}>{d.name} ({d.count})</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Users Table */}
            {loading ? <LoadingState /> : users.length === 0 ? (
                <EmptyState message={t.noUsers} icon={Users} />
            ) : (
                <>
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="text-left px-4 py-3 font-semibold text-slate-600">{t.users}</th>
                                        <th className="text-left px-4 py-3 font-semibold text-slate-600 hidden md:table-cell">{t.email}</th>
                                        <th className="text-left px-4 py-3 font-semibold text-slate-600">{t.role}</th>
                                        <th className="text-left px-4 py-3 font-semibold text-slate-600">{t.credits}</th>
                                        <th className="text-left px-4 py-3 font-semibold text-slate-600 hidden lg:table-cell">{t.district}</th>
                                        <th className="text-left px-4 py-3 font-semibold text-slate-600 hidden md:table-cell">{t.joined}</th>
                                        <th className="text-left px-4 py-3 font-semibold text-slate-600">{t.actions}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {users.map((u) => (
                                        <tr key={u._id} className={`hover:bg-slate-50/50 transition-colors ${u.account_flagged ? 'bg-red-50/40' : ''}`}>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                                        {(u.fullName || u.username || '?')[0].toUpperCase()}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-semibold text-slate-800 truncate">{u.fullName || u.username}</p>
                                                        <p className="text-xs text-slate-400 truncate">@{u.username}</p>
                                                    </div>
                                                    {u.account_flagged && <Flag className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-slate-600 hidden md:table-cell">
                                                <span className="truncate block max-w-[180px]">{u.email}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <RoleBadge role={u.role} />
                                            </td>
                                            <td className="px-4 py-3 text-slate-600">
                                                <div className="text-xs">
                                                    <span className="font-bold text-slate-700">{u.credits ?? 0}</span>
                                                    <span className="text-slate-400"> / {u.dailyLimit ?? 200}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-slate-600 hidden lg:table-cell">{u.district}</td>
                                            <td className="px-4 py-3 text-slate-500 text-xs hidden md:table-cell">{formatDate(u.createdAt)}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => setSelectedUser(selectedUser?._id === u._id ? null : u)}
                                                        className="p-1.5 rounded-lg hover:bg-indigo-50 text-indigo-600 transition-colors"
                                                        title={t.viewDetails}
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => toggleFlag(u._id, u.account_flagged)}
                                                        disabled={actionLoading === u._id}
                                                        className={`p-1.5 rounded-lg transition-colors ${u.account_flagged ? 'hover:bg-green-50 text-green-600' : 'hover:bg-orange-50 text-orange-600'}`}
                                                        title={u.account_flagged ? t.unflag : t.flag}
                                                    >
                                                        <Flag className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => deleteUser(u._id, u.username)}
                                                        disabled={actionLoading === u._id}
                                                        className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                                                        title={t.delete}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* User Detail Panel */}
                    {selectedUser && (
                        <UserDetailPanel user={selectedUser} onClose={() => setSelectedUser(null)} />
                    )}

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="flex items-center justify-between bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200 px-4 py-3 shadow-sm">
                            <span className="text-sm text-slate-500">
                                {t.showing} {((pagination.page - 1) * 15) + 1}–{Math.min(pagination.page * 15, pagination.totalCount)} {t.of} {pagination.totalCount}
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => fetchUsers(pagination.page - 1)}
                                    disabled={pagination.page <= 1}
                                    className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-40 transition-colors"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <span className="text-sm font-medium text-slate-700">
                                    {t.page} {pagination.page} {t.of} {pagination.totalPages}
                                </span>
                                <button
                                    onClick={() => fetchUsers(pagination.page + 1)}
                                    disabled={pagination.page >= pagination.totalPages}
                                    className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-40 transition-colors"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );

    // ==================== USER DETAIL PANEL ====================
    const UserDetailPanel = ({ user: u, onClose }) => {
        const [formData, setFormData] = useState({
            credits: u.credits,
            dailyLimit: u.dailyLimit,
            isPremium: u.isPremium || false
        });

        useEffect(() => {
            setFormData({
                credits: u.credits,
                dailyLimit: u.dailyLimit,
                isPremium: u.isPremium || false
            });
        }, [u]);

        const handleChange = (e) => {
            const { name, value, type, checked } = e.target;
            setFormData(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            }));
        };

        return (
            <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-indigo-200 p-4 md:p-5 shadow-lg animate-in slide-in-from-top-2">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white text-lg font-bold">
                            {(u.fullName || u.username || '?')[0].toUpperCase()}
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-800">{u.fullName}</h3>
                            <p className="text-sm text-slate-500">@{u.username}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
                        <XCircle className="w-5 h-5" />
                    </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                    <Detail label={t.email} value={u.email} />
                    <Detail label={t.phone} value={u.phone || '—'} />
                    <Detail label={t.role} value={<RoleBadge role={u.role} />} />
                    <Detail label={t.credits} value={`${u.credits ?? 0} / ${u.dailyLimit ?? 200}`} />
                    <Detail label={t.district} value={u.district} />
                    <Detail label="DS Division" value={u.dsDivision} />
                    <Detail label="GN Division" value={u.gnDivision} />
                    {u.role === 'officer' && (
                        <>
                            <Detail label={t.officerId} value={u.officerId} />
                            <Detail label={t.department} value={u.department || '—'} />
                            <Detail label={t.designation} value={u.designation || '—'} />
                            <Detail label={t.approvalStatus} value={
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${u.approvalStatus === 'approved' ? 'bg-green-100 text-green-700' :
                                    u.approvalStatus === 'rejected' ? 'bg-red-100 text-red-700' :
                                        'bg-orange-100 text-orange-700'
                                    }`}>
                                    {u.approvalStatus === 'approved' ? <CheckCircle className="w-3 h-3" /> :
                                        u.approvalStatus === 'rejected' ? <XCircle className="w-3 h-3" /> :
                                            <Clock className="w-3 h-3" />}
                                    {u.approvalStatus || 'approved'}
                                </span>
                            } />
                        </>
                    )}
                    <Detail label={t.joined} value={formatDate(u.createdAt)} />
                    <Detail label={t.status} value={
                        u.account_flagged
                            ? <span className="text-red-600 font-semibold flex items-center gap-1"><Flag className="w-3 h-3" /> Flagged</span>
                            : <span className="text-green-600 font-semibold flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Active</span>
                    } />
                    <Detail label="Premium" value={u.isPremium ? 'Yes 🌟' : 'No'} />
                </div>

                {/* Role Change */}
                <div className="mt-4 pt-4 border-t border-slate-200">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="text-sm font-medium text-slate-600">{t.changeRole}:</span>
                        <select
                            value={u.role}
                            onChange={(e) => changeRole(u._id, e.target.value)}
                            disabled={actionLoading === u._id}
                            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="farmer">Farmer</option>
                            <option value="officer">Officer</option>
                            <option value="buyer">Buyer</option>
                            <option value="admin">Admin</option>
                            <option value="moderator">Moderator</option>
                        </select>
                    </div>

                    {/* Credit Management */}
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">{t.updateCredits}</h4>
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                updateCredits(u._id, formData.credits, formData.dailyLimit, formData.isPremium);
                            }}
                            className="flex flex-col gap-3"
                        >
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <label className="text-[10px] text-slate-500 font-bold mb-0.5 block">{t.credits}</label>
                                    <input name="credits" type="number" value={formData.credits} onChange={handleChange} className="w-full px-2 py-1.5 text-sm border rounded" />
                                </div>
                                <div className="flex-1">
                                    <label className="text-[10px] text-slate-500 font-bold mb-0.5 block">{t.dailyLimit}</label>
                                    <input name="dailyLimit" type="number" value={formData.dailyLimit} onChange={handleChange} className="w-full px-2 py-1.5 text-sm border rounded" />
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        name="isPremium"
                                        id="isPremium"
                                        checked={formData.isPremium}
                                        onChange={handleChange}
                                        className="rounded text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <label htmlFor="isPremium" className="text-sm text-slate-700 font-medium cursor-pointer">Premium User 🌟</label>
                                </div>
                                <button type="submit" className="px-4 py-1.5 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm">Update</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        );
    };

    const Detail = ({ label, value }) => (
        <div>
            <p className="text-xs text-slate-400 font-medium mb-0.5">{label}</p>
            <div className="text-slate-700 font-medium">{value}</div>
        </div>
    );

    // ==================== APPROVALS TAB ====================
    const ApprovalsTab = () => {
        if (loading) return <LoadingState />;
        if (pendingOfficers.length === 0) return <EmptyState message={t.noPending} icon={UserCheck} />;

        return (
            <div className="space-y-3">
                {pendingOfficers.map((officer) => (
                    <div key={officer._id} className="bg-white/90 backdrop-blur-sm rounded-xl border border-orange-200 p-4 md:p-5 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex flex-col md:flex-row md:items-center gap-4">
                            {/* Officer Info */}
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                                    {(officer.fullName || officer.username || '?')[0].toUpperCase()}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h4 className="font-bold text-slate-800">{officer.fullName}</h4>
                                        <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                                            <Clock className="w-3 h-3" /> {t.pending}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-500">@{officer.username} · {officer.email}</p>
                                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-slate-500">
                                        <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> {officer.officerId}</span>
                                        <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" /> {officer.department || '—'}</span>
                                        <span className="flex items-center gap-1"><User className="w-3 h-3" /> {officer.designation || '—'}</span>
                                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {officer.district}</span>
                                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatDate(officer.createdAt)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <button
                                    onClick={() => approveOfficer(officer._id)}
                                    disabled={actionLoading === officer._id}
                                    className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 shadow-sm"
                                >
                                    <CheckCircle className="w-4 h-4" />
                                    {t.approve}
                                </button>
                                <button
                                    onClick={() => setRejectionModal(officer._id)}
                                    disabled={actionLoading === officer._id}
                                    className="flex items-center gap-1.5 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 border border-red-200"
                                >
                                    <XCircle className="w-4 h-4" />
                                    {t.reject}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    // ==================== FLAGGED TAB ====================
    const FlaggedTab = () => {
        if (loading) return <LoadingState />;
        if (flaggedUsers.length === 0) return <EmptyState message={t.noFlagged} icon={AlertTriangle} />;

        return (
            <div className="space-y-3">
                {flaggedUsers.map((u) => (
                    <div key={u._id} className="bg-white/90 backdrop-blur-sm rounded-xl border border-red-200 p-4 md:p-5 shadow-sm">
                        <div className="flex flex-col md:flex-row md:items-center gap-3">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                                    {(u.fullName || u.username || '?')[0].toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                    <p className="font-bold text-slate-800">{u.fullName || u.username}</p>
                                    <p className="text-xs text-slate-500">@{u.username} · {u.email}</p>
                                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                                        <RoleBadge role={u.role} />
                                        <span>{u.district}</span>
                                        {u.false_report_count > 0 && (
                                            <span className="text-red-600 font-semibold">{u.false_report_count} false reports</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <button
                                    onClick={() => toggleFlag(u._id, true)}
                                    disabled={actionLoading === u._id}
                                    className="flex items-center gap-1.5 px-3 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg text-sm font-semibold transition-colors border border-green-200"
                                >
                                    <CheckCircle className="w-4 h-4" />
                                    {t.unflag}
                                </button>
                                <button
                                    onClick={() => deleteUser(u._id, u.username)}
                                    disabled={actionLoading === u._id}
                                    className="flex items-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-sm font-semibold transition-colors border border-red-200"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    {t.delete}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    // ==================== SHARED COMPONENTS ====================
    const LoadingState = () => (
        <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-3">
                <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
                <p className="text-sm text-slate-500 font-medium">{t.loading}</p>
            </div>
        </div>
    );

    const EmptyState = ({ message, icon: Icon }) => (
        <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                <Icon className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-500 font-medium">{message}</p>
        </div>
    );

    // ==================== MAIN RENDER ====================
    return (
        <div className="space-y-4 md:space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-slate-800 rounded-xl md:rounded-2xl p-4 md:p-6 text-white shadow-xl">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl md:text-2xl font-black tracking-tight">{t.title}</h1>
                        <p className="text-indigo-200 text-xs md:text-sm mt-0.5">{t.subtitle}</p>
                    </div>
                    <button
                        onClick={() => { fetchStats(); if (activeTab === 'users') fetchUsers(1); else if (activeTab === 'approvals') fetchPendingOfficers(); else if (activeTab === 'flagged') fetchFlaggedUsers(); }}
                        className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                        title="Refresh"
                    >
                        <RefreshCw className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1.5 bg-white/60 backdrop-blur-sm rounded-xl p-1.5 border border-slate-200 shadow-sm overflow-x-auto">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => { setActiveTab(tab.id); setError(null); }}
                            className={`flex items-center gap-1.5 px-3 md:px-4 py-2 md:py-2.5 rounded-lg text-xs md:text-sm font-semibold transition-all whitespace-nowrap ${isActive
                                ? 'bg-indigo-600 text-white shadow-md'
                                : 'text-slate-600 hover:bg-slate-100'
                                }`}
                        >
                            <Icon className="w-4 h-4" />
                            {tab.label}
                            {tab.badge > 0 && (
                                <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${isActive ? 'bg-white/20 text-white' : 'bg-red-100 text-red-700'
                                    }`}>
                                    {tab.badge}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Error State */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between">
                    <p className="text-red-700 text-sm font-medium">{error}</p>
                    <button onClick={() => { setError(null); fetchStats(); }} className="text-red-600 hover:text-red-800 text-sm font-semibold">
                        {t.retry}
                    </button>
                </div>
            )}

            {/* Tab Content */}
            {activeTab === 'overview' && <OverviewTab />}
            {activeTab === 'users' && <UsersTab />}
            {activeTab === 'approvals' && <ApprovalsTab />}
            {activeTab === 'flagged' && <FlaggedTab />}

            {/* Rejection Modal */}
            {rejectionModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => { setRejectionModal(null); setRejectionReason(''); }}>
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-slate-800 mb-1 flex items-center gap-2">
                            <XCircle className="w-5 h-5 text-red-500" />
                            {t.reject} Officer
                        </h3>
                        <p className="text-sm text-slate-500 mb-4">
                            {language === 'si' ? 'ප්‍රතික්ෂේප කිරීමට හේතුවක් ඇතුළත් කරන්න' : 'Please provide a reason for rejection'}
                        </p>
                        <textarea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder={t.rejectionReason}
                            className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                            rows={3}
                            autoFocus
                        />
                        <div className="flex justify-end gap-2 mt-4">
                            <button
                                onClick={() => { setRejectionModal(null); setRejectionReason(''); }}
                                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={rejectOfficer}
                                disabled={!rejectionReason.trim() || actionLoading === rejectionModal}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 shadow-sm"
                            >
                                {t.reject}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
