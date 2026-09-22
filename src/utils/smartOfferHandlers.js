/**
 * Helpers partagés pour les offres personnalisées (smart offers) côté Web.
 */

/**
 * Libellé convivial du moment d'activation du cashback différé
 */
export const getDeferredActivationLabel = (offer) => {
  const rule = offer?.deferredActivationRule || "immediate";
  const targetDay = offer?.deferredTargetDay;
  if (rule === "immediate") return "dès aujourd'hui";
  if (rule === "next_weekend") return "ce week-end";
  if (rule === "next_week" || rule === "next_monday" || targetDay === 1) return "ce lundi";
  if (rule === "next_tuesday" || targetDay === 2) return "ce mardi";
  if (rule === "next_wednesday" || targetDay === 3) return "ce mercredi";
  if (rule === "next_thursday" || targetDay === 4) return "ce jeudi";
  if (rule === "next_friday" || targetDay === 5) return "ce vendredi";
  if (rule === "next_saturday" || targetDay === 6) return "ce samedi";
  if (rule === "next_sunday" || targetDay === 0) return "ce dimanche";
  return "prochainement";
};
