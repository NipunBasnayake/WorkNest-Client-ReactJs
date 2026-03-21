import { useNetworkStore } from "@/store/networkStore";

export function useNetworkStatus() {
  const isBrowserOnline = useNetworkStore((state) => state.isBrowserOnline);
  const issue = useNetworkStore((state) => state.issue);
  const clearIssue = useNetworkStore((state) => state.clearIssue);

  return {
    isBrowserOnline,
    issue,
    clearIssue,
    hasIssue: Boolean(issue),
  };
}
