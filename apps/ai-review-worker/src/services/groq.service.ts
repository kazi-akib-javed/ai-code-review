import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Groq from 'groq-sdk';
import { ReviewCommentDto } from '@app/shared';
import { IAIReviewService } from '@app/shared/interfaces/ai-review.interface';

@Injectable()
export class GroqService implements IAIReviewService {
  private readonly logger = new Logger(GroqService.name);
  private readonly client: Groq;

  constructor(private readonly configService: ConfigService) {
    this.client = new Groq({
      apiKey: this.configService.get<string>('GROQ_API_KEY'),
    });
  }

  async reviewDiff(
    diff: string,
    prTitle: string,
    repoFullName: string,
  ): Promise<{ comments: ReviewCommentDto[]; summary: string }> {
    this.logger.log(`Sending diff to Groq for review: ${repoFullName}`);

    const prompt = `You are an expert code reviewer. Review the following git diff and provide actionable feedback.

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

    const response = await this.client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.choices[0]?.message?.content;

    if (!content) {
      throw new Error('Empty response from Groq');
    }

    try {
      const clean = content.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);
      return {
        summary: parsed.summary,
        comments: parsed.comments,
      };
    } catch {
      this.logger.error('Failed to parse Groq response', content);
      throw new Error('Failed to parse review response');
    }
  }
}