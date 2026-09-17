/* Al Reyadah English Department Portfolio
   Safe Shared Backend Preparation
*/

window.PORTFOLIO_SHARED = {
  url: "https://hobfifobduqslvnagwlb.supabase.co",
  key: "sb_publishable_fbK9aPfpg1rgqy32fPR59A_uxp-kygF"
};

(function () {
  const MAIN_KEY = "engDeptPortfolioV2";
  const BACKUP_KEY = "engDeptPortfolioV2_before_shared_sync";

  try {
    const existing = localStorage.getItem(MAIN_KEY);

    if (existing && !localStorage.getItem(BACKUP_KEY)) {
      localStorage.setItem(BACKUP_KEY, existing);
      console.log("Portfolio safety backup created.");
    }

    console.log("English Department Portfolio: Supabase connection ready.");
  } catch (error) {
    console.error("Portfolio safety preparation error:", error);
  }
})();
