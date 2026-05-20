import React, { useState, useEffect, useRef } from "react";
import { 
  X, Upload, User, Globe, Mail, Phone, MapPin, Briefcase, 
  Linkedin, Twitter, Github, Instagram, Facebook, AlertCircle, Eye
} from "lucide-react";
import { Contact } from "../types";

interface CardEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (contact: Contact) => Promise<boolean>;
  initialContact?: Contact;
}

export default function CardEditorModal({ 
  isOpen, 
  onClose, 
  onSave, 
  initialContact 
}: CardEditorModalProps) {
  const [formData, setFormData] = useState<Contact>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    title: "",
    organization: "",
    website: "",
    address: "",
    avatar: "",
    socials: {
      linkedin: "",
      twitter: "",
      github: "",
      instagram: "",
      facebook: ""
    }
  });

  const [saving, setSaving] = useState(false);
  const [errorString, setErrorString] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialContact) {
      setFormData({
        _id: initialContact._id,
        firstName: initialContact.firstName || "",
        lastName: initialContact.lastName || "",
        email: initialContact.email || "",
        phone: initialContact.phone || "",
        title: initialContact.title || "",
        organization: initialContact.organization || "",
        website: initialContact.website || "",
        address: initialContact.address || "",
        avatar: initialContact.avatar || "",
        socials: {
          linkedin: initialContact.socials?.linkedin || "",
          twitter: initialContact.socials?.twitter || "",
          github: initialContact.socials?.github || "",
          instagram: initialContact.socials?.instagram || "",
          facebook: initialContact.socials?.facebook || ""
        }
      });
    } else {
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        title: "",
        organization: "",
        website: "",
        address: "",
        avatar: "",
        socials: {
          linkedin: "",
          twitter: "",
          github: "",
          instagram: "",
          facebook: ""
        }
      });
    }
    setErrorString(null);
  }, [initialContact, isOpen]);

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSocialChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      socials: {
        ...prev.socials,
        [name]: value
      }
    }));
  };

  const processFile = (file: File) => {
    if (file.size > 1.5 * 1024 * 1024) {
      setErrorString("Maximum file size is 1.5MB. Please choose a smaller image.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        setFormData(prev => ({ ...prev, avatar: reader.result as string }));
        setErrorString(null);
      }
    };
    reader.onerror = () => {
      setErrorString("Failed to read image file.");
    };
    reader.readAsDataURL(file);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  // Drag and drop event handlers
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      processFile(file);
    } else {
      setErrorString("Only image files are supported of format PNG or JPEG.");
    }
  };

  const clearAvatar = () => {
    setFormData(prev => ({ ...prev, avatar: "" }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorString(null);

    // Basic Validation Check
    if (!formData.firstName.trim()) {
      setErrorString("First Name is a mandatory field.");
      setSaving(false);
      return;
    }

    try {
      const success = await onSave(formData);
      if (success) {
        onClose();
      }
    } catch (err: any) {
      setErrorString(err.message || "An error occurred while saving card information.");
    } finally {
      setSaving(false);
    }
  };

  const initials = `${formData.firstName?.charAt(0) || ""}${formData.lastName?.charAt(0) || ""}`.toUpperCase();

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div 
        className="w-full max-w-5xl bg-white rounded-2xl sm:rounded-2xl border border-zinc-200 shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[88vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header toolbar */}
        <div className="flex items-center justify-between p-4 px-6 border-b border-zinc-200 bg-zinc-50">
          <div>
            <h2 className="text-base font-bold text-zinc-900 font-sans tracking-tight">
              {initialContact ? "Edit Business Card" : "New Digital Business Card"}
            </h2>
            <p className="text-zinc-400 text-[10px] font-mono mt-0.5">CARDNET CREATIVE ENGINE</p>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-zinc-200 text-zinc-400 hover:text-zinc-700 rounded-lg transition"
            id="close-modal-x"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Outer Split layout splits cleanly */}
        <div className="flex-grow overflow-y-auto grid grid-cols-1 lg:grid-cols-12 bg-white">
          
          {/* Form Side - Column width 7/12 */}
          <form 
            onSubmit={handleSubmit} 
            className="lg:col-span-7 p-6 border-r border-zinc-200 flex flex-col space-y-5"
          >
            {errorString && (
              <div className="flex items-start gap-3 p-3.5 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-xs font-sans">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{errorString}</span>
              </div>
            )}

            {/* Step 1: Avatar Upload section with dual actions Drag-And-Drop / File selection */}
            <div>
              <label className="block text-xs font-bold text-zinc-400 tracking-wider uppercase mb-2">
                Card Avatar/Profile Photo
              </label>
              
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <div 
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  className="w-full flex-grow border-2 border-dashed border-zinc-200 hover:border-zinc-300 bg-zinc-50/50 rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition relative group"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  
                  <div className="w-10 h-10 rounded-xl bg-white border border-zinc-200 flex items-center justify-center mb-2.5 text-zinc-400 group-hover:text-zinc-600 transition shadow-xs">
                    <Upload className="w-4 h-4" />
                  </div>
                  <p className="text-xs font-semibold text-zinc-700">
                    Drag card profile here, or <span className="text-indigo-600 font-bold decoration-indigo-600 underline decoration-1">browse</span>
                  </p>
                  <p className="text-[10px] text-zinc-400 mt-1 font-mono">PNG, JPG, RAW (Max 1.5MB)</p>
                </div>

                {/* Avatar status preview */}
                <div className="w-20 h-20 flex-shrink-0 rounded-2xl bg-zinc-50 ring-2 ring-zinc-100 p-1 flex items-center justify-center relative select-none border border-zinc-200">
                  {formData.avatar ? (
                    <>
                      <img 
                        src={formData.avatar} 
                        alt="Avatar preview" 
                        className="w-full h-full object-cover rounded-xl"
                        referrerPolicy="no-referrer"
                      />
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          clearAvatar();
                        }}
                        className="absolute -top-1.5 -right-1.5 p-0.5 bg-rose-600 hover:bg-rose-500 hover:scale-105 active:scale-95 text-white rounded-full transition shadow-md border border-white"
                        title="Remove Avatar"
                        id="btn-remove-avatar"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </>
                  ) : (
                    <span className="text-xl font-bold font-mono text-zinc-400">
                      {initials || <User className="w-7 h-7 text-zinc-300" />}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Step 2: Key Details Grid */}
            <div className="space-y-4">
              <h3 className="text-[10px] font-bold text-indigo-600 tracking-widest uppercase border-b border-zinc-100 pb-1.5">
                Core Information
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-500 mb-1 font-sans">First Name <span className="text-rose-500 font-bold">*</span></label>
                  <div className="relative">
                    <input 
                      type="text" 
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      placeholder="Jane"
                      className="w-full pl-3.5 pr-3.5 py-2.5 bg-zinc-50 rounded-xl border border-zinc-200 hover:border-zinc-300 focus:border-zinc-400 focus:outline-none text-zinc-900 text-sm font-sans transition placeholder:text-zinc-400"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-500 mb-1 font-sans">Last Name</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      placeholder="Doe"
                      className="w-full pl-3.5 pr-3.5 py-2.5 bg-zinc-50 rounded-xl border border-zinc-200 hover:border-zinc-300 focus:border-zinc-400 focus:outline-none text-zinc-900 text-sm font-sans transition placeholder:text-zinc-400"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-500 mb-1 font-sans">Professional Title</label>
                  <input 
                    type="text" 
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Principal Designer"
                    className="w-full pl-3.5 pr-3.5 py-2.5 bg-zinc-50 rounded-xl border border-zinc-200 hover:border-zinc-300 focus:border-zinc-400 focus:outline-none text-zinc-900 text-sm font-sans transition placeholder:text-zinc-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-500 mb-1 font-sans">Organization Name</label>
                  <input 
                    type="text" 
                    name="organization"
                    value={formData.organization}
                    onChange={handleInputChange}
                    placeholder="Google Cloud"
                    className="w-full pl-3.5 pr-3.5 py-2.5 bg-zinc-50 rounded-xl border border-zinc-200 hover:border-zinc-300 focus:border-zinc-400 focus:outline-none text-zinc-900 text-sm font-sans transition placeholder:text-zinc-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-500 mb-1 font-sans">Work Email</label>
                  <input 
                    type="email" 
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="jane.doe@work.com"
                    className="w-full pl-3.5 pr-3.5 py-2.5 bg-zinc-50 rounded-xl border border-zinc-200 hover:border-zinc-300 focus:border-zinc-400 focus:outline-none text-zinc-900 text-sm font-sans transition placeholder:text-zinc-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-500 mb-1 font-sans">Phone Number</label>
                  <input 
                    type="tel" 
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+1 (555) 012-3456"
                    className="w-full pl-3.5 pr-3.5 py-2.5 bg-zinc-50 rounded-xl border border-zinc-200 hover:border-zinc-300 focus:border-zinc-400 focus:outline-none text-zinc-900 text-sm font-sans transition placeholder:text-zinc-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-500 mb-1 font-sans">Website URL</label>
                  <input 
                    type="url" 
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    placeholder="https://janedoe.com"
                    className="w-full pl-3.5 pr-3.5 py-2.5 bg-zinc-50 rounded-xl border border-zinc-200 hover:border-zinc-300 focus:border-zinc-400 focus:outline-none text-zinc-900 text-sm font-sans transition placeholder:text-zinc-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-500 mb-1 font-sans">Physical Address</label>
                  <input 
                    type="text" 
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="1600 Amphitheatre Pkwy, Mountain View, CA"
                    className="w-full pl-3.5 pr-3.5 py-2.5 bg-zinc-50 rounded-xl border border-zinc-200 hover:border-zinc-300 focus:border-zinc-400 focus:outline-none text-zinc-900 text-sm font-sans transition placeholder:text-zinc-400"
                  />
                </div>
              </div>
            </div>

            {/* Step 3: Social Media Handles */}
            <div className="space-y-4 pt-1">
              <h3 className="text-[10px] font-bold text-indigo-600 tracking-widest uppercase border-b border-zinc-100 pb-1.5">
                Social Profiles (Usernames only)
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-1.5 text-[11px] text-zinc-500 mb-1 font-sans">
                    <Linkedin className="w-3.5 h-3.5 text-zinc-400" /> LinkedIn
                  </label>
                  <input 
                    type="text" 
                    name="linkedin"
                    value={formData.socials.linkedin}
                    onChange={handleSocialChange}
                    placeholder="jane-doe-design"
                    className="w-full pl-3.5 pr-3.5 py-2.5 bg-zinc-50 rounded-xl border border-zinc-200 hover:border-zinc-300 focus:border-zinc-400 focus:outline-none text-zinc-900 text-sm font-sans transition placeholder:text-zinc-400"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-1.5 text-[11px] text-zinc-500 mb-1 font-sans">
                    <Twitter className="w-3.5 h-3.5 text-zinc-400" /> Twitter (X)
                  </label>
                  <input 
                    type="text" 
                    name="twitter"
                    value={formData.socials.twitter}
                    onChange={handleSocialChange}
                    placeholder="janedoe_x"
                    className="w-full pl-3.5 pr-3.5 py-2.5 bg-zinc-50 rounded-xl border border-zinc-200 hover:border-zinc-300 focus:border-zinc-400 focus:outline-none text-zinc-900 text-sm font-sans transition placeholder:text-zinc-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="flex items-center gap-1.5 text-[11px] text-zinc-500 mb-1 font-sans">
                    <Github className="w-3.5 h-3.5 text-zinc-400" /> GitHub
                  </label>
                  <input 
                    type="text" 
                    name="github"
                    value={formData.socials.github}
                    onChange={handleSocialChange}
                    placeholder="janedoe-github"
                    className="w-full pl-3.5 pr-3.5 py-2.5 bg-zinc-50 rounded-xl border border-zinc-200 hover:border-zinc-300 focus:border-zinc-400 focus:outline-none text-zinc-900 text-sm font-sans transition placeholder:text-zinc-400"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-1.5 text-[11px] text-zinc-500 mb-1 font-sans">
                    <Instagram className="w-3.5 h-3.5 text-zinc-400" /> Instagram
                  </label>
                  <input 
                    type="text" 
                    name="instagram"
                    value={formData.socials.instagram}
                    onChange={handleSocialChange}
                    placeholder="janedoe_lens"
                    className="w-full pl-3.5 pr-3.5 py-2.5 bg-zinc-50 rounded-xl border border-zinc-200 hover:border-zinc-300 focus:border-zinc-400 focus:outline-none text-zinc-900 text-sm font-sans transition placeholder:text-zinc-400"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-1.5 text-[11px] text-zinc-500 mb-1 font-sans">
                    <Facebook className="w-3.5 h-3.5 text-zinc-400" /> Facebook
                  </label>
                  <input 
                    type="text" 
                    name="facebook"
                    value={formData.socials.facebook}
                    onChange={handleSocialChange}
                    placeholder="janedoe_official"
                    className="w-full pl-3.5 pr-3.5 py-2.5 bg-zinc-50 rounded-xl border border-zinc-200 hover:border-zinc-300 focus:border-zinc-400 focus:outline-none text-zinc-900 text-sm font-sans transition placeholder:text-zinc-400"
                  />
                </div>
              </div>
            </div>

            {/* Bottom Form Actions */}
            <div className="flex gap-3 justify-end pt-4 border-t border-zinc-100">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="py-2.5 px-5 text-sm font-semibold rounded-xl bg-white border border-zinc-200 hover:bg-zinc-50 hover:text-zinc-900 text-zinc-650 active:scale-98 transition font-sans"
                id="btn-cancel-modal"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="py-2.5 px-6 text-sm font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white transition disabled:opacity-50 font-sans shadow-sm"
                id="btn-submit-modal"
              >
                {saving ? "Saving..." : initialContact ? "Save Changes" : "Create Card"}
              </button>
            </div>
          </form>

          {/* RIGHT SIDE: PREMIUM LIVE PREVIEW PANEL - Column width 5/12 */}
          <div className="lg:col-span-5 bg-zinc-50/50 p-6 flex flex-col justify-start items-center border-t lg:border-t-0 border-zinc-200 overflow-y-auto">
            <div className="sticky top-0 w-full flex flex-col items-center">
              
              <div className="w-full flex items-center justify-between mb-4 px-1">
                <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-zinc-450 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-indigo-600" /> Live Interactive Preview
                </span>
                <span className="text-[9px] font-mono text-zinc-400">CARDSIMULATOR v3.0</span>
              </div>

              {/* CARD PREVIEW WRAPPER */}
              <div className="w-full max-w-sm aspect-[1.6/1] bg-gradient-to-br from-zinc-850 to-zinc-950 rounded-[1.8rem] border border-zinc-800/85 shadow-lg overflow-hidden relative p-5 flex flex-col justify-between select-none text-white">
                
                {/* MicroChip / Logo Design */}
                <div className="flex justify-between items-start">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-mono tracking-widest text-zinc-500 block leading-none">CARDNET ID</span>
                    <span className="text-zinc-400 text-[10px] font-mono font-medium leading-none mt-1">
                      {formData.organization?.substring(0, 18) || "ORGANIZATION"}
                    </span>
                  </div>
                  {/* Frosted logo placeholder */}
                  <span className="text-xs font-bold font-mono text-zinc-300 tracking-widest px-2 py-0.5 border border-zinc-800 bg-zinc-900/80 rounded-md">
                    CNT
                  </span>
                </div>

                {/* Contact name and title */}
                <div className="flex items-center gap-4 mt-2">
                  <div className="w-14 h-14 rounded-full ring-2 ring-zinc-805 bg-zinc-900 p-0.5 flex items-center justify-center overflow-hidden flex-shrink-0 border border-zinc-800">
                    {formData.avatar ? (
                      <img 
                        src={formData.avatar} 
                        alt="Preview" 
                        className="w-full h-full object-cover rounded-full"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <span className="text-sm font-bold font-mono text-zinc-400">
                        {initials || "UN"}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-base font-bold text-zinc-100 truncate leading-tight">
                      {formData.firstName || formData.lastName ? `${formData.firstName} ${formData.lastName}`.trim() : "Jane Doe"}
                    </h4>
                    <p className="text-indigo-400 text-xs font-semibold truncate leading-none mt-1 uppercase font-sans tracking-wider">
                      {formData.title || "Position Title"}
                    </p>
                  </div>
                </div>

                {/* Contact data grid */}
                <div className="grid grid-cols-2 gap-y-1.5 border-t border-zinc-900/80 pt-3.5 text-[9.5px] font-mono text-zinc-400 tracking-normal.">
                  <div className="flex items-center gap-1.5 truncate">
                    <Phone className="w-3 h-3 text-zinc-650 flex-shrink-0" />
                    <span className="truncate">{formData.phone || "No Phone"}</span>
                  </div>
                  <div className="flex items-center gap-1.5 truncate">
                    <Mail className="w-3 h-3 text-zinc-650 flex-shrink-0" />
                    <span className="truncate">{formData.email || "No Email"}</span>
                  </div>
                  <div className="flex items-center gap-1.5 truncate">
                    <Globe className="w-3 h-3 text-zinc-650 flex-shrink-0" />
                    <span className="truncate">{formData.website ? formData.website.replace(/^https?:\/\//, "") : "No Website"}</span>
                  </div>
                  <div className="flex items-center gap-1.5 truncate">
                    <MapPin className="w-3 h-3 text-zinc-650 flex-shrink-0" />
                    <span className="truncate">{formData.address || "No Address"}</span>
                  </div>
                </div>
              </div>

              {/* QR Mini Code Section in preview mode */}
              <div className="w-full max-w-sm mt-5 bg-white border border-zinc-200 p-3.5 rounded-2xl flex items-center gap-4">
                <div className="w-12 h-12 bg-zinc-50 p-1.5 rounded-lg flex items-center justify-center text-zinc-800 border border-zinc-250">
                  {/* Dynamic miniature QR code indicator representation */}
                  <div className="grid grid-cols-3 gap-0.5 opacity-60 w-full h-full">
                    <div className="bg-zinc-600"></div><div className="bg-zinc-600"></div><div className="bg-zinc-50"></div>
                    <div className="bg-zinc-50"></div><div className="bg-zinc-600"></div><div className="bg-zinc-600"></div>
                    <div className="bg-zinc-600"></div><div className="bg-zinc-50"></div><div className="bg-zinc-600"></div>
                  </div>
                </div>
                <div>
                  <h5 className="text-[11px] font-bold text-zinc-800">Automatic QR Code Provision</h5>
                  <p className="text-[10px] text-zinc-400 font-mono mt-0.5">Every card receives a dedicated QR link immediately.</p>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
