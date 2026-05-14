import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { ReviewCommentDto, IAIReviewService } from '@app/shared';

@Injectable()
export class ClaudeAIService implements IAIReviewService {
  private readonly logger = new Logger(ClaudeAIService.name);
  private readonly client: Anthropic;

  constructor(private readonly configService: ConfigService) {
    this.client = new Anthropic({
      apiKey: this.configService.get<string>('CLAUDE_API_KEY'),
    });
  }

  async reviewDiff(
    diff: string,
    prTitle: string,
    repoFullName: string,
  ): Promise<{ comments: ReviewCommentDto[]; summary: string }> {
    this.logger.log(`Sending diff to Claude for review: ${repoFullName}`);

    const prompt = this.buildPrompt(diff, prTitle, repoFullName);

    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    try {
      const clean = content.text.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);
      return {
        summary: parsed.summary,
        comments: parsed.comments,
      };
    } catch {
      this.logger.error('Failed to parse Claude response', content.text);
      throw new Error('Failed to parse Claude review response');
    }
  }

  private buildPrompt(diff: string, prTitle: string, repoFullName: string): string {
    return `You are an expert code reviewer. Review the following git diff and provide actionable feedback.

Repository: ${repoFullName}
PR Title: ${prTitle}

Git Diff:
\`\`\`
${diff}
\`\`\`

Respond ONLY with a valid JSON object in this exact format, no markdown, no explanation:
{
  "summary": "Brief overall summary of the PR in 2-3 sentences",
  "comments": [
    {
      "filePath": "path/to/file.ts",
      "line": 42,
      "body": "Detailed comment about this specific line",
      "severity": "info|warning|error"
    }
  ]
}

Rules:
- severity "error" = bugs, security issues, breaking changes
- severity "warning" = code smells, performance issues, missing error handling
- severity "info" = suggestions, style improvements, best practices
- Only comment on lines present in the diff (+ lines)
- Maximum 10 comments
- Be specific and actionable`;
  }
}