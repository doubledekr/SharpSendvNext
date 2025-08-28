// DEMO ENVIRONMENT COMPLETELY DISABLED
// NO MOCK DATA INITIALIZATION
console.log("Demo environment module disabled - no mock data will be created");

export function getDemoConfig() {
  return { enabled: false };
}

export function setDemoEnabled(enabled: boolean) {
  // Always disabled
}

export async function initializeDemoEnvironment() {
  console.log("Demo environment disabled - no mock data initialization");
  return { success: false, error: "Demo environment disabled" };
}

export async function cleanupDemoData() {
  console.log("Demo cleanup disabled - no mock data to clean");
  return { success: true };
}