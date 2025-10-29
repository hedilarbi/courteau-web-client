"use client";
import BackButton from "@/components/BackButton";
import Spinner from "@/components/spinner/Spinner";
import { useUser } from "@/context/UserContext";
import { updateUserInfo } from "@/services/UserServices";
import React from "react";

const Page = () => {
  const { user, loading } = useUser();
  const [form, setForm] = React.useState({
    name: "",
    email: "",
    phone: "",
    dob: "",
  });
  const [errors, setErrors] = React.useState({});
  const [saving, setSaving] = React.useState(false);
  const [success, setSuccess] = React.useState("");

  React.useEffect(() => {
    if (user) {
      setForm({
        name: user.name || "",

        email: user.email || "",
        phone: user.phone_number || "",
        dob: user.date_of_birth
          ? new Date(user.date_of_birth).toISOString().split("T")[0]
          : "",
      });
    }
  }, [user]);

  const validate = (values) => {
    const e = {};
    if (!values.name.trim()) e.name = "Le prénom est requis.";

    if (!values.dob) e.dob = "La date de naissance est requise.";
    if (!values.email.trim()) {
      e.email = "L'email est requis.";
    } else {
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!re.test(values.email)) e.email = "Format d'email invalide.";
    }
    if (!values.phone.trim()) {
      e.phone = "Le numéro de téléphone est requis.";
    } else {
      const phoneRe = /^\+?\d{6,15}$/;
      if (!phoneRe.test(values.phone))
        e.phone = "Numéro invalide (6-15 chiffres, + optionnel).";
    }
    return e;
  };

  const handleChange = (e) => {
    setForm((s) => ({ ...s, [e.target.name]: e.target.value }));
    setErrors((s) => ({ ...s, [e.target.name]: undefined }));
    setSuccess("");
  };

  const modifier = async (e) => {
    e.preventDefault();
    const v = validate(form);
    if (Object.keys(v).length) {
      setErrors(v);
      return;
    }
    setSaving(true);
    setErrors({});
    setSuccess("");
    try {
      // Remplacez l'URL par votre endpoint réel si nécessaire
      const response = await updateUserInfo(user._id, form.name, form.email);
      if (response.status) {
        setSuccess("Profil enregistré avec succès.");
      } else {
        setErrors({ form: "Impossible de sauvegarder. Réessayez plus tard." });
      }
    } catch (err) {
      setErrors({ form: "Impossible de sauvegarder. Réessayez plus tard." });
    } finally {
      setSaving(false);
    }
  };
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen md:mt-28 mt-20">
        <Spinner />
      </div>
    );
  }
  return (
    <div className="md:mt-28 mt-20 bg-[#F3F4F6] md:px-14 px-4 pt-2 pb-20 relative ">
      <BackButton />
      <h1 className="text-2xl font-bold mb-4 mt-4">Modifier le profil</h1>
      <form onSubmit={modifier} className="max-w-3xl">
        {errors.form && (
          <div className="mb-4 text-red-600 bg-red-50 p-3 rounded">
            {errors.form}
          </div>
        )}
        {success && (
          <div className="mb-4 text-green-700 bg-green-50 p-3 rounded">
            {success}
          </div>
        )}

        <div className=" space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Nom et Prénom
            </label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded bg-white ${
                errors.name ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.name && (
              <p className="text-red-600 text-sm mt-1">{errors.name}</p>
            )}
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded bg-white ${
                errors.email ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.email && (
              <p className="text-red-600 text-sm mt-1">{errors.email}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Numéro de téléphone
            </label>
            <input
              name="phone"
              value={form.phone}
              //onChange={handleChange}
              disabled={true}
              placeholder="+33123456789"
              className={`w-full px-3 py-2 border rounded bg-white ${
                errors.phone ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.phone && (
              <p className="text-red-600 text-sm mt-1">{errors.phone}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Date de naissance
            </label>
            <input
              type="date"
              name="date_of_birth"
              value={form.dob}
              disabled={true}
              //onChange={handleChange}
              className={`w-full px-3 py-2 border rounded bg-white ${
                errors.dob ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.dob && (
              <p className="text-red-600 text-sm mt-1">{errors.dob}</p>
            )}
          </div>
        </div>

        <div className="mt-6">
          <button
            type="submit"
            disabled={saving}
            className="bg-pr cursor-pointer text-black  px-4 py-2 rounded disabled:opacity-50"
          >
            {saving ? "Sauvegarde..." : "Sauvegarder"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Page;
