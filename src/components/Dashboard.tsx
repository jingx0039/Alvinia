import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { 
  Users, Plus, Search, Mail, Phone, MapPin, Trash2, Edit, Share2, 
  QrCode, ExternalLink, Globe, Copy, Check, Download, AlertTriangle, 
  RefreshCw, RefreshCcw, User 
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Contact } from "../types";
import StatusIndicator from "./StatusIndicator";
import CardEditorModal from "./CardEditorModal";

export default function Dashboard() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorString, setErrorString] = useState<string | null>(null);
  
  // Search & Filtration
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | undefined>(undefined);
  
  // Shared interactive states
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeQrId, setActiveQrId] = useState<string | null>(null);

  const fetchContacts = async () => {
    setLoading(true);
    setErrorString(null);
    try {
      const res = await fetch("/api/contacts");
      if (!res.ok) {
        throw new Error("Could not load contact card directories.");
      }
      const data = await res.json();
      setContacts(data);
    } catch (err: any) {
      console.error("Error retrieving contacts:", err);
      setErrorString(err.message || "Failed to establish a safe database websocket link.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const handleCreateNew = () => {
    setEditingContact(undefined);
    setIsModalOpen(true);
  };

  const handleEditClick = (contact: Contact) => {
    setEditingContact(contact);
    setIsModalOpen(true);
  };

  const handleDeleteClick = async (id?: string) => {
    if (!id) return;
    if (!window.confirm("Are you absolutely sure you want to delete this digital business card? This operation cannot be undone.")) {
      return;
    }

    try {
      const res = await fetch(`/api/contacts/${id}`, {
        method: "DELETE"
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to remove business card.");
      }

      // Remove from client list
      setContacts(prev => prev.filter(c => c._id !== id));
      if (activeQrId === id) setActiveQrId(null);
    } catch (err: any) {
      alert(err.message || "An error occurred during deletion.");
    }
  };

  const handleSaveContact = async (contactData: Contact): Promise<boolean> => {
    const isUpdate = !!contactData._id;
    const url = isUpdate ? `/api/contacts/${contactData._id}` : "/api/contacts";
    const method = isUpdate ? "PUT" : "POST";

    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(contactData)
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error || "Communication failure while storing card payload.");
    }

    const savedDoc = await response.json();

    if (isUpdate) {
      setContacts(prev => prev.map(c => c._id === savedDoc._id ? savedDoc : c));
    } else {
      setContacts(prev => [savedDoc, ...prev]);
    }

    return true;
  };

  const copyCardLink = (id: string) => {
    const cardUrl = `${window.location.origin}/card/${id}`;
    navigator.clipboard.writeText(cardUrl);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const downloadQrCode = (id: string, firstName: string) => {
    const svgEl = document.getElementById(`qr-svg-${id}`);
    if (!svgEl) return;

    // Convert SVG to clean base64 image encoding and trigger download
    const svgString = new XMLSerializer().serializeToString(svgEl);
    const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const blobUrl = URL.createObjectURL(svgBlob);
    
    const downloadLink = document.createElement("a");
    downloadLink.href = blobUrl;
    downloadLink.download = `${firstName.toLowerCase()}_card_qr.svg`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  // Filtered list computed
  const filteredContacts = contacts.filter(contact => {
    const fullName = `${contact.firstName} ${contact.lastName}`.toLowerCase();
    const matchName = fullName.includes(searchQuery.toLowerCase());
    const matchTitle = (contact.title || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchOrg = (contact.organization || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchName || matchTitle || matchOrg;
  });

  return (
    <div className="flex h-screen bg-zinc-50 text-zinc-900 overflow-hidden font-sans">
      
      {/* SIDEBAR NAVIGATION - Clean Minimalism theme */}
      <aside className="hidden md:flex flex-col justify-between w-64 h-full bg-white border-r border-zinc-200 p-6 shrink-0">
        <div className="space-y-6">
          {/* Branded Logo */}
          <div className="flex items-center gap-3 px-1 py-1">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-white text-xs">
              CN
            </div>
            <div>
              <h1 className="text-sm font-black text-zinc-900 tracking-wider">CARDNET</h1>
              <span className="text-[9px] font-mono font-bold tracking-widest text-indigo-600">ENTERPRISE</span>
            </div>
          </div>

          {/* Navigation option */}
          <nav className="space-y-1.5">
            <button 
              type="button"
              className="w-full flex items-center justify-between py-2.5 px-3.5 bg-zinc-100 text-sm font-semibold text-zinc-900 rounded-xl border border-zinc-200 transition shadow-sm"
              id="sidebar-nav-contacts"
            >
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4 text-indigo-600" />
                <span>Contact Cards</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white border border-zinc-250 text-zinc-550 font-bold">
                {contacts.length}
              </span>
            </button>
          </nav>
        </div>

        {/* Dynamic system engine connectivity monitor at the bottom */}
        <div className="mt-auto">
          <StatusIndicator />
        </div>
      </aside>

      {/* PRIMARY VIEWER PORT */}
      <main className="flex-grow h-full overflow-y-auto flex flex-col justify-between">
        
        {/* Dynamic Navbar */}
        <header className="px-8 py-4 border-b border-zinc-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Logo on small displays */}
            <div className="md:hidden w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-black text-white text-xs">
              CN
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900 tracking-tight leading-none">Cards Directory</h2>
              <p className="text-[10px] text-zinc-450 font-mono mt-1">ORGANIZATION DIGITAL WALLET DIRECTORY</p>
            </div>
          </div>

          {/* Actions panel */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-grow sm:flex-grow-0 sm:w-72">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text"
                placeholder="Search by name, title, company..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm font-sans placeholder:text-zinc-450 transition text-zinc-800"
                id="search-input"
              />
            </div>

            <button
              onClick={handleCreateNew}
              className="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-semibold text-white text-sm flex items-center gap-2 tracking-wide transition shadow-sm hover:shadow active:scale-98 flex-shrink-0"
              id="btn-create-new-card"
            >
              <Plus className="w-4 h-4" /> Create Card
            </button>
          </div>
        </header>

        {/* Central Display panel */}
        <div className="p-8 flex-grow">
          {errorString ? (
            /* RED ERROR ALERT WITH RETRY BUTTON - Direct Requirement */
            <div className="w-full bg-rose-50 border-2 border-rose-100 rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-sm max-w-2xl mx-auto my-8">
              <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 mb-4">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-rose-700 tracking-tight font-sans">Database Link Failure</h3>
              <p className="text-zinc-550 text-xs mt-1.5 max-w-md leading-relaxed">
                {errorString}. The server might be booting up or offline. Please check your system configuration.
              </p>
              <button 
                onClick={fetchContacts}
                className="mt-5 flex items-center gap-2 px-5 py-2.5 bg-rose-100 hover:bg-rose-200 active:scale-95 text-rose-700 hover:text-rose-800 border border-rose-200 rounded-xl text-xs font-semibold transition animate-pulse"
                id="btn-retry-fetch"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Try Reconnecting
              </button>
            </div>
          ) : loading ? (
            /* Active Loader */
            <div className="flex flex-col items-center justify-center py-24">
              <div className="w-10 h-10 border-2 border-zinc-200 border-t-indigo-600 rounded-full animate-spin mb-3" />
              <p className="text-xs text-zinc-400 font-mono animate-pulse tracking-wide">Syncing directories...</p>
            </div>
          ) : filteredContacts.length === 0 ? (
            /* Empty State State Display */
            <div className="text-center py-20 px-4 max-w-sm mx-auto">
              <div className="w-14 h-14 bg-zinc-100 border border-zinc-200 rounded-2xl flex items-center justify-center text-zinc-400 mx-auto mb-4.5">
                <Users className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-bold text-zinc-800">No Professional Cards Found</h3>
              <p className="text-zinc-500 text-xs mt-1 leading-relaxed">
                {searchQuery ? "No matches found. Try entering a different keyword." : "Get started by generating your enterprise's first digital business card (vCard)!"}
              </p>
              {!searchQuery && (
                <button
                  onClick={handleCreateNew}
                  className="mt-5 inline-flex items-center gap-2 py-2 px-4 rounded-xl bg-zinc-100 border border-zinc-200 hover:bg-zinc-200 hover:text-zinc-855 text-xs font-bold text-zinc-500 transition"
                  id="empty-state-btn-create"
                >
                  <Plus className="w-3.5 h-3.5" /> Create Digital Card
                </button>
              )}
            </div>
          ) : (
            /* CONTACTS CARDS GRID LAYOUT - Strict requirement */
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredContacts.map(contact => {
                const initials = `${contact.firstName?.charAt(0) || ""}${contact.lastName?.charAt(0) || ""}`.toUpperCase();
                const cardUrl = `${window.location.origin}/card/${contact._id}`;
                const isQrOpen = activeQrId === contact._id;

                return (
                  <div 
                    key={contact._id}
                    className="bg-white rounded-2xl border border-zinc-205 border-zinc-200 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between overflow-hidden relative group"
                  >
                    {/* Top Accent Strip */}
                    <div className="h-1.5 w-full bg-zinc-100 group-hover:bg-indigo-600 transition-colors" />

                    <div className="p-5 flex-grow">
                      
                      {/* Avatar initials / image block */}
                      <div className="flex items-start gap-4 justify-between">
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="w-12 h-12 rounded-2xl overflow-hidden flex-shrink-0 bg-zinc-50 border border-zinc-200 flex items-center justify-center relative p-0.5 ring-2 ring-zinc-100">
                            {contact.avatar ? (
                              <img 
                                src={contact.avatar} 
                                alt={`${contact.firstName} ${contact.lastName}`} 
                                className="w-full h-full object-cover rounded-xl"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <span className="text-sm font-bold font-mono text-zinc-500 tracking-wide select-none">
                                {initials || <User className="w-5 h-5 text-zinc-400" />}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-sm font-bold text-zinc-900 truncate leading-snug">
                              {contact.firstName} {contact.lastName}
                            </h3>
                            <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider truncate leading-normal">
                              {contact.title || "No Title"}
                            </p>
                            {contact.organization && (
                              <p className="text-[10px] text-zinc-400 truncate mt-0.5 leading-none font-mono">
                                {contact.organization}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Top Link button to open live preview directly */}
                        <Link 
                          to={`/card/${contact._id}`}
                          className="p-2 bg-zinc-50 hover:bg-zinc-100 rounded-xl text-zinc-500 hover:text-zinc-950 border border-zinc-200 transition"
                          title="Open public card viewer link"
                          id={`btn-open-link-${contact._id}`}
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>

                      {/* Info lines parameters */}
                      <div className="mt-5 space-y-2 text-[11px] text-zinc-650 tracking-normal border-t border-zinc-100 pt-4 font-mono">
                        {contact.phone && (
                          <div className="flex items-center gap-2 truncate">
                            <Phone className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                            <span className="truncate">{contact.phone}</span>
                          </div>
                        )}
                        {contact.email && (
                          <div className="flex items-center gap-2 truncate">
                            <Mail className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                            <span className="truncate">{contact.email}</span>
                          </div>
                        )}
                        {contact.address && (
                          <div className="flex items-center gap-2 truncate">
                            <MapPin className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                            <span className="truncate">{contact.address}</span>
                          </div>
                        )}
                        {contact.website && (
                          <div className="flex items-center gap-2 truncate">
                            <Globe className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                            <span className="truncate">{contact.website}</span>
                          </div>
                        )}
                      </div>

                      {/* Displaying Social Integration Handles Tags */}
                      <div className="flex flex-wrap gap-1.5 mt-4.5 pt-1">
                        {contact.socials?.linkedin && (
                          <span className="text-[9px] font-mono px-2 py-0.5 rounded-lg bg-indigo-50/65 text-indigo-700 border border-indigo-100/60">
                            in/..{contact.socials.linkedin.substring(0, 5)}
                          </span>
                        )}
                        {contact.socials?.twitter && (
                          <span className="text-[9px] font-mono px-2 py-0.5 rounded-lg bg-zinc-50 text-zinc-600 border border-zinc-150">
                            @{contact.socials.twitter.substring(0, 5)}
                          </span>
                        )}
                        {contact.socials?.github && (
                          <span className="text-[9px] font-mono px-2 py-0.5 rounded-lg bg-zinc-50 text-zinc-700 border border-zinc-200">
                            git/..{contact.socials.github.substring(0, 5)}
                          </span>
                        )}
                      </div>

                    </div>

                    {/* Action Footbar with Edit, Delete, Copy Share links, QR togglers */}
                    <div className="p-3 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between gap-2.5">
                      
                      {/* Left actions: Copy URL / Toggle QR */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => copyCardLink(contact._id!)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-white border border-zinc-200 hover:bg-zinc-50 hover:text-zinc-900 rounded-lg text-xs font-semibold text-zinc-650 transition"
                          title="Copy public link to clipboard"
                          id={`btn-copy-link-${contact._id}`}
                        >
                          {copiedId === contact._id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-emerald-600 font-bold">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 text-zinc-400" />
                              <span>Copy Link</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => setActiveQrId(isQrOpen ? null : contact._id!)}
                          className={`p-1.5 rounded-lg border transition ${isQrOpen ? "bg-indigo-600 border-indigo-600 text-white" : "bg-white border-zinc-200 hover:bg-zinc-50 text-zinc-400 hover:text-zinc-805"}`}
                          title="Generate QR code for Card"
                          id={`btn-toggle-qr-${contact._id}`}
                        >
                          <QrCode className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Right actions: Edit, Delete */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEditClick(contact)}
                          className="p-1.5 bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-500 hover:text-zinc-900 rounded-lg transition"
                          title="Edit Card"
                          id={`btn-edit-${contact._id}`}
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(contact._id)}
                          className="p-1.5 bg-red-50 hover:bg-red-100 border border-red-150 pl-2/8 pt-1.5 hover:border-red-200 text-rose-600 hover:text-rose-700 rounded-lg transition"
                          title="Delete Card"
                          id={`btn-delete-${contact._id}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                    </div>

                    {/* QR Code expansion drawer */}
                    {isQrOpen && (
                      <div className="p-4 bg-zinc-50 border-t border-zinc-100 flex flex-col items-center justify-center space-y-3 animate-fadeIn">
                        <div className="bg-white p-2.5 rounded-xl border border-zinc-200/60 shadow-inner">
                          <QRCodeSVG 
                            id={`qr-svg-${contact._id}`}
                            value={cardUrl} 
                            size={120}
                            bgColor="#ffffff"
                            fgColor="#09090b"
                            level="M"
                            includeMargin={false}
                          />
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] text-zinc-500 font-mono">Scan code to view vCard instantly</p>
                          <button
                            onClick={() => downloadQrCode(contact._id!, contact.firstName)}
                            type="button"
                            className="mt-2 inline-flex items-center gap-1.5 text-[10px] text-indigo-600 hover:text-indigo-700 font-bold uppercase transition"
                            id={`btn-dl-qr-${contact._id}`}
                          >
                            <Download className="w-3 h-3" /> Save QR Code SVG
                          </button>
                        </div>
                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Small screen mobile device notification header containing connectivity engine details */}
        <footer className="md:hidden p-4 bg-white border-t border-zinc-200 select-none">
          <StatusIndicator />
        </footer>

      </main>

      {/* Primary Card Creation and Editing overlay */}
      <CardEditorModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveContact}
        initialContact={editingContact}
      />

    </div>
  );
}
