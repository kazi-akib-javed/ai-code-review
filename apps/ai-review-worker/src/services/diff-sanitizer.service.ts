import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class DiffSanitizerService {
  private readonly logger = new Logger(DiffSanitizerService.name);

  private readonly INJECTION_PATTERNS = [
    /ignore\s+(previous|above|all)\s+instructions?/gi,
    /disregard\s+(previous|above|all)\s+instructions?/gi,
    /forget\s+(previous|above|all)\s+instructions?/gi,
    /you\s+are\s+now\s+a/gi,
    /act\s+as\s+(a|an)\s+/gi,
    /pretend\s+(you\s+are|to\s+be)/gi,
    /system\s*:\s*you/gi,
    /\[SYSTEM\]/gi,
    /\[INST\]/gi,
    /<<SYS>>/gi,
    /<\|system\|>/gi,
    /###\s*(instruction|system|prompt)/gi,
    /respond\s+only\s+with\s+(json|valid)/gi,
    /output\s+only\s+(json|valid)/gi,
  ];

  private readonly MAX_DIFF_SIZE = 50000;

  sanitize(diff: string): string {
    if (!diff) return '';

    if (diff.length > this.MAX_DIFF_SIZE) {
      this.logger.warn(
        `Diff too large (${diff.length} chars), truncating to ${this.MAX_DIFF_SIZE}`,
      );
      diff = diff.substring(0, this.MAX_DIFF_SIZE) + '\n... [diff truncated]';
    }

    const lines = diff.split('\n');
    const sanitizedLines = lines.map((line) => this.sanitizeLine(line));

    const removedCount = sanitizedLines.filter((l) =>
      l.includes('[sanitized]'),
    ).length;

    if (removedCount > 0) {
      this.logger.warn(
        `Sanitized ${removedCount} potentially malicious lines from diff`,
      );
    }

    return sanitizedLines.join('\n');
  }

  private sanitizeLine(line: string): string {
    const isAddedLine = line.startsWith('+');
    const isRemovedLine = line.startsWith('-');

    if (!isAddedLine && !isRemovedLine) {
      return line;
    }

    for (const pattern of this.INJECTION_PATTERNS) {
      if (pattern.test(line)) {
        pattern.lastIndex = 0;
        const prefix = line[0];
        return `${prefix} [sanitized: potential prompt injection detected]`;
      }
      pattern.lastIndex = 0;
    }

    return line;
  }
}