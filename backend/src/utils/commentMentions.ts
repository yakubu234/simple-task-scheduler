export function extractMentionedEmails(content: string) {
  const mentions = content.match(/@([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})/g) ?? [];
  return [...new Set(mentions.map((mention) => mention.slice(1).toLowerCase()))];
}
