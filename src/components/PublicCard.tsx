import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { 
  Phone, Mail, MessageSquare, MapPin, Globe, Linkedin, Twitter, 
  Github, Instagram, Facebook, ArrowLeft, Download, Share2, 
  Check, User, ShieldAlert 
} from "lucide-react";
import { motion } from "motion/react";
import { Contact } from "../types";

export default function PublicCard() {
  const { id } = useParams<{ id: string }>();
  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorString, setErrorString] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [vcardCopied, setVcardCopied] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchCard = async () => {
      setLoading(true);
      setErrorString(null);
      try {
        const res = await fetch(`/api/contacts/${id}`);
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error("This digital business card does not exist.");
          } else if (res.status === 400) {
            throw new Error("Invalid digital business card identifier code format.");
          }
          throw new Error("Failed to load details of the digital business card.");
        }
        const data = await res.json();
        setContact(data);
      } catch (err: any) {
        console.error("Error loading public card:", err);
        setErrorString(err.message || "An error occurred while loading this card.");
      } finally {
        setLoading(false);
      }
    };

    fetchCard();
  }, [id]);

  // Helper to format social link URLs properly
  const getSocialUrl = (platform: string, username: string) => {
    if (!username) return "";
    if (username.startsWith("http://") || username.startsWith("https://")) return username;
    
    switch (platform) {
      case "linkedin":
        return `https://linkedin.com/in/${username}`;
      case "twitter":
        return `https://twitter.com/${username}`;
      case "github":
        return `https://github.com/${username}`;
      case "instagram":
        return `https://instagram.com/${username}`;
      case "facebook":
        return `https://facebook.com/${username}`;
      default:
        return username;
    }
  };

  const downloadVCard = () => {
    if (!contact) return;

    // Split image source to base64 content only if it exists
    let rawBase64 = "";
    if (contact.avatar && contact.avatar.includes("base64,")) {
      rawBase64 = contact.avatar.split("base64,")[1];
    }

    // Build vCard standard data format
    const vCardLines = [
      "BEGIN:VCARD",
      "VERSION:3.0",
      `N:${contact.lastName || ""};${contact.firstName || ""};;;`,
      `FN:${contact.firstName || ""} ${contact.lastName || ""}`.trim(),
      `ORG:${contact.organization || ""}`,
      `TITLE:${contact.title || ""}`,
      contact.phone ? `TEL;TYPE=CELL,VOICE:${contact.phone}` : "",
      contact.email ? `EMAIL;TYPE=PREF,INTERNET:${contact.email}` : "",
      contact.address ? `ADR;TYPE=WORK:;;${contact.address};;;;` : "",
      contact.website ? `URL:${contact.website}` : "",
    ];

    // Inject social profiles as customized fields
    if (contact.socials?.linkedin) {
      vCardLines.push(`X-SOCIALPROFILE;type=linkedin:${getSocialUrl("linkedin", contact.socials.linkedin)}`);
    }
    if (contact.socials?.twitter) {
      vCardLines.push(`X-SOCIALPROFILE;type=twitter:${getSocialUrl("twitter", contact.socials.twitter)}`);
    }
    if (contact.socials?.github) {
      vCardLines.push(`X-SOCIALPROFILE;type=github:${getSocialUrl("github", contact.socials.github)}`);
    }

    // Inject image Base64 inside vCard
    if (rawBase64) {
      vCardLines.push(`PHOTO;TYPE=JPEG;ENCODING=b:${rawBase64}`);
    }

    vCardLines.push("END:VCARD");

    // Clean empty lines
    const vCardContent = vCardLines.filter(line => line.trim() !== "").join("\r\n");

    const blob = new Blob([vCardContent], { type: "text/vcard;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${contact.firstName || "card"}_${contact.lastName || "net"}.vcf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setVcardCopied(true);
    setTimeout(() => setVcardCopied(false), 2500);
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    const shareTitle = contact ? `${contact.firstName} ${contact.lastName} | CARDNET` : "CARDNET Digital Business Card";

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: `Check out digital business card for ${contact?.firstName} ${contact?.lastName}`,
          url: shareUrl,
        });
      } catch (err) {
        console.log("Error sharing via navigator.share:", err);
        // Fall back to copy
        copyToClipboard(shareUrl);
      }
    } else {
      copyToClipboard(shareUrl);
    }
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col items-center justify-center p-6">
        <div className="w-10 h-10 border-2 border-zinc-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
        <p className="text-zinc-400 text-xs font-mono tracking-wide animate-pulse">Retrieving business card...</p>
      </div>
    );
  }

  if (errorString || !contact) {
    return (
      <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col items-center justify-center p-6">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-rose-600 mb-6 border border-zinc-200">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold font-sans tracking-tight mb-2">Card Not Found</h1>
        <p className="text-zinc-500 text-sm text-center max-w-sm mb-8 font-sans leading-relaxed">
          {errorString || "The business card you are looking for has expired, was deleted, or never existed in CardNet database."}
        </p>
        <Link 
          to="/" 
          className="flex items-center gap-2 hover:gap-3 transition-all px-6 py-3 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 font-sans text-xs font-bold hover:border-zinc-300 shadow-sm text-zinc-700"
          id="link-error-back-home"
        >
          <ArrowLeft className="w-4 h-4" /> Go back to CardNet dashboard
        </Link>
      </div>
    );
  }

  // Generate fallback initials
  const initials = `${contact.firstName?.charAt(0) || ""}${contact.lastName?.charAt(0) || ""}`.toUpperCase();

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex items-center justify-center p-0 sm:p-4">
      <div className="w-full max-w-md bg-white sm:rounded-2xl min-h-screen sm:min-h-0 sm:shadow-lg border border-transparent sm:border-zinc-200/80 overflow-hidden relative font-sans flex flex-col justify-between">
        
        {/* Top Minimal Header */}
        <div className="p-4 flex items-center justify-between border-b border-zinc-100 bg-white">
          <Link 
            to="/" 
            className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-900 text-[10px] font-mono font-bold py-1 px-3 bg-zinc-50 rounded-full transition hover:bg-zinc-100"
            id="link-back-dashboard"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> CARDNET
          </Link>
          <div className="px-2.5 py-0.5 rounded-full text-[10px] font-mono tracking-widest bg-emerald-50 text-emerald-700 border border-emerald-100 font-bold">
            PUBLIC CARD
          </div>
        </div>

        {/* Floating gradient orb background behind card */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-64 h-64 bg-indigo-500/5 rounded-full blur-[80px] pointer-events-none" />

        <div className="p-6 pt-8 pb-10 flex-grow">
          {/* Avatar Area */}
          <div className="flex flex-col items-center text-center">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="relative w-32 h-32 rounded-3xl ring-4 ring-zinc-50 p-1 bg-white mb-5 flex items-center justify-center overflow-hidden border border-zinc-200"
            >
              {contact.avatar ? (
                <img 
                  src={contact.avatar} 
                  alt={`${contact.firstName} ${contact.lastName}`}
                  className="w-full h-full object-cover rounded-2xl"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full rounded-2xl bg-gradient-to-br from-zinc-100 to-zinc-200 flex items-center justify-center">
                  <span className="text-3xl font-bold font-mono tracking-wider text-zinc-500">
                    {initials || <User className="w-10 h-10 text-zinc-400" />}
                  </span>
                </div>
              )}
            </motion.div>

            {/* Profile Info */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
            >
              <h1 className="text-xl font-bold tracking-tight text-zinc-900 leading-tight">
                {contact.firstName} {contact.lastName}
              </h1>
              {contact.title && (
                <p className="text-indigo-600 text-xs font-bold tracking-wider font-sans mt-1.5 uppercase">
                  {contact.title}
                </p>
              )}
              {contact.organization && (
                <p className="text-zinc-400 text-[10px] font-mono font-bold mt-1 uppercase">
                  {contact.organization}
                </p>
              )}
              {contact.address && (
                <div className="flex items-center justify-center gap-1 text-zinc-500 text-xs mt-3.5 max-w-xs mx-auto">
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-zinc-400" />
                  <span className="truncate">{contact.address}</span>
                </div>
              )}
            </motion.div>
          </div>

          {/* Quick Actions Circular Section */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.4 }}
            className="grid grid-cols-4 gap-4 max-w-xs mx-auto mt-8 px-2"
          >
            {/* CALL */}
            <a 
              href={contact.phone ? `tel:${contact.phone}` : "#"}
              className={`flex flex-col items-center gap-1.5 ${!contact.phone ? "pointer-events-none opacity-30" : "group"}`}
              title={contact.phone || "No phone provided"}
              id="action-call-public"
            >
              <div className="w-12 h-12 rounded-full bg-zinc-50 group-hover:bg-zinc-100 hover:scale-105 active:scale-95 transition flex items-center justify-center border border-zinc-200">
                <Phone className="w-4 h-4 text-zinc-650 group-hover:text-zinc-900" />
              </div>
              <span className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider">Call</span>
            </a>

            {/* EMAIL */}
            <a 
              href={contact.email ? `mailto:${contact.email}` : "#"}
              className={`flex flex-col items-center gap-1.5 ${!contact.email ? "pointer-events-none opacity-30" : "group"}`}
              title={contact.email || "No email provided"}
              id="action-email-public"
            >
              <div className="w-12 h-12 rounded-full bg-zinc-50 group-hover:bg-zinc-100 hover:scale-105 active:scale-95 transition flex items-center justify-center border border-zinc-200">
                <Mail className="w-4 h-4 text-zinc-650 group-hover:text-zinc-900" />
              </div>
              <span className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider">Email</span>
            </a>

            {/* SMS */}
            <a 
              href={contact.phone ? `sms:${contact.phone}` : "#"}
              className={`flex flex-col items-center gap-1.5 ${!contact.phone ? "pointer-events-none opacity-30" : "group"}`}
              title={contact.phone || "No phone provided"}
              id="action-sms-public"
            >
              <div className="w-12 h-12 rounded-full bg-zinc-50 group-hover:bg-zinc-100 hover:scale-105 active:scale-95 transition flex items-center justify-center border border-zinc-200">
                <MessageSquare className="w-4 h-4 text-zinc-650 group-hover:text-zinc-900" />
              </div>
              <span className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider">SMS</span>
            </a>

            {/* MAP NAVIGATION */}
            <a 
              href={contact.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contact.address)}` : "#"}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex flex-col items-center gap-1.5 ${!contact.address ? "pointer-events-none opacity-30" : "group"}`}
              title={contact.address || "No address provided"}
              id="action-map-public"
            >
              <div className="w-12 h-12 rounded-full bg-zinc-50 group-hover:bg-zinc-100 hover:scale-105 active:scale-95 transition flex items-center justify-center border border-zinc-200">
                <MapPin className="w-4 h-4 text-zinc-650 group-hover:text-zinc-900" />
              </div>
              <span className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider">Map</span>
            </a>
          </motion.div>

          {/* Social Links Section */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="mt-8 space-y-2"
          >
            {contact.website && (
              <a 
                href={getSocialUrl("website", contact.website)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 border border-zinc-150 rounded-xl bg-zinc-50/50 hover:bg-zinc-100/50 transition"
                id="link-web-public"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white border border-zinc-200 flex items-center justify-center text-zinc-505 shadow-xs">
                    <Globe className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <span className="text-[9px] text-zinc-400 block font-mono">Website</span>
                    <span className="text-xs font-bold text-zinc-800">{contact.website}</span>
                  </div>
                </div>
                <ArrowLeft className="w-3.5 h-3.5 text-zinc-400 rotate-180" />
              </a>
            )}

            {contact.socials?.linkedin && (
              <a 
                href={getSocialUrl("linkedin", contact.socials.linkedin)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 border border-zinc-150 rounded-xl bg-zinc-50/50 hover:bg-zinc-100/50 transition"
                id="link-linkedin-public"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50/80 flex items-center justify-center text-indigo-600 border border-indigo-100/30">
                    <Linkedin className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <span className="text-[9px] text-zinc-400 block font-mono">LinkedIn</span>
                    <span className="text-xs font-bold text-zinc-800">@{contact.socials.linkedin.replace(/.*\/(in|u)\//, "")}</span>
                  </div>
                </div>
                <ArrowLeft className="w-3.5 h-3.5 text-zinc-400 rotate-180" />
              </a>
            )}

            {contact.socials?.twitter && (
              <a 
                href={getSocialUrl("twitter", contact.socials.twitter)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 border border-zinc-150 rounded-xl bg-zinc-50/50 hover:bg-zinc-100/50 transition"
                id="link-twitter-public"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white border border-zinc-200 flex items-center justify-center text-zinc-500 shadow-xs">
                    <Twitter className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <span className="text-[9px] text-zinc-400 block font-mono">Twitter</span>
                    <span className="text-xs font-bold text-zinc-800">@{contact.socials.twitter}</span>
                  </div>
                </div>
                <ArrowLeft className="w-3.5 h-3.5 text-zinc-400 rotate-180" />
              </a>
            )}

            {contact.socials?.github && (
              <a 
                href={getSocialUrl("github", contact.socials.github)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 border border-zinc-150 rounded-xl bg-zinc-50/50 hover:bg-zinc-100/50 transition"
                id="link-github-public"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-700 shadow-xs">
                    <Github className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <span className="text-[9px] text-zinc-400 block font-mono">GitHub</span>
                    <span className="text-xs font-bold text-zinc-800">@{contact.socials.github}</span>
                  </div>
                </div>
                <ArrowLeft className="w-3.5 h-3.5 text-zinc-400 rotate-180" />
              </a>
            )}

            {contact.socials?.instagram && (
              <a 
                href={getSocialUrl("instagram", contact.socials.instagram)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 border border-zinc-150 rounded-xl bg-zinc-50/50 hover:bg-zinc-100/50 transition"
                id="link-instagram-public"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white border border-zinc-200 flex items-center justify-center text-zinc-505 shadow-xs">
                    <Instagram className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <span className="text-[9px] text-zinc-400 block font-mono">Instagram</span>
                    <span className="text-xs font-bold text-zinc-800">@{contact.socials.instagram}</span>
                  </div>
                </div>
                <ArrowLeft className="w-3.5 h-3.5 text-zinc-400 rotate-180" />
              </a>
            )}
          </motion.div>
        </div>

        {/* Action Controls Footer */}
        <div className="p-5 bg-zinc-50 border-t border-zinc-100 flex gap-3 z-10 sm:rounded-b-2xl">
          <button 
            onClick={downloadVCard}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-indigo-650 hover:bg-indigo-700 active:scale-95 transition text-white rounded-xl text-xs font-bold shadow-sm"
            id="vcard-download-public"
          >
            {vcardCopied ? (
              <>
                <Check className="w-4 h-4" /> Added to device!
              </>
            ) : (
              <>
                <Download className="w-4 h-4" /> Save Contacts
              </>
            )}
          </button>
          
          <button 
            type="button"
            onClick={handleShare}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-white hover:bg-zinc-50 active:scale-95 transition text-zinc-700 rounded-xl text-xs font-bold border border-zinc-200 shadow-sm"
            id="card-share-public"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" /> Copied!
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4" /> Share URL
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
