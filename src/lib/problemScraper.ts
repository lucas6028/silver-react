/**
 * Utility to fetch problem details from competitive programming platforms
 */

export interface ScrapedProblemData {
  title: string;
  platform: string;
  difficulty?: string;
  tags?: string[];
  url: string;
}

/**
 * Parse LeetCode problem slug from URL
 * Example: https://leetcode.com/problems/two-sum/ -> two-sum
 */
function getLeetCodeSlug(url: string): string | null {
  const match = url.match(/leetcode\.com\/problems\/([^/]+)/);
  return match ? match[1] : null;
}

/**
 * Fetch problem details from LeetCode using their GraphQL API
 */
export async function scrapeLeetCodeProblem(url: string): Promise<ScrapedProblemData | null> {
  const slug = getLeetCodeSlug(url);
  if (!slug) return null;

  try {
    const query = `
      query questionData($titleSlug: String!) {
        question(titleSlug: $titleSlug) {
          questionId
          title
          difficulty
          topicTags {
            name
          }
        }
      }
    `;

    const response = await fetch("https://leetcode.com/graphql", {
      method: "POST",
      headers: {
          "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        variables: { titleSlug: slug },
      }),
    });

    if (!response.ok) {
      console.error('LeetCode API request failed:', response.status);
      return null;
    }

    const data = await response.json();
    
    if (!data.data?.question) {
      console.error('No question data found');
      return null;
    }

    const question = data.data.question;
    
    // Map LeetCode tags to our predefined tags
    const tagMap: Record<string, string> = {
      'dynamic-programming': 'DP',
      'graph': 'Graph',
      'greedy': 'Greedy',
      'math': 'Math',
      'string': 'Strings',
      'implementation': 'Impl',
    };

    const tags: string[] = question.topicTags
      .map((tag: { name: string }) => {
        const normalized = tag.name.toLowerCase().replace(/\s+/g, '-');
        return tagMap[normalized] || null;
      })
      .filter((tag: string | null): tag is string => tag !== null);

    return {
      title: `${question.questionId}. ${question.title}`,
      platform: 'LeetCode',
      difficulty: question.difficulty,
      tags: Array.from(new Set(tags)), // Remove duplicates
      url
    };
  } catch (error) {
    console.error('Error fetching LeetCode problem:', error);
    return null;
  }
}

/**
 * Parse Codeforces problem from URL
 * Examples:
 * - https://codeforces.com/problemset/problem/1899/A
 * - https://codeforces.com/contest/1899/problem/A
 * - https://codeforces.com/gym/104114/problem/A
 */
function getCodeforcesId(url: string): { contestId: string; problemIndex: string; isGym: boolean } | null {
  // Match contest or problemset URLs
  let match = url.match(/codeforces\.com\/(?:problemset\/problem|contest)\/(\d+)\/(?:problem\/)?([A-Z]\d?)/i);
  if (match) {
    return { contestId: match[1], problemIndex: match[2], isGym: false };
  }
  
  // Match gym URLs
  match = url.match(/codeforces\.com\/gym\/(\d+)\/problem\/([A-Z]\d?)/i);
  if (match) {
    return { contestId: match[1], problemIndex: match[2], isGym: true };
  }
  
  return null;
}

/**
 * Scrape Codeforces problem from contest, problemset, or gym
 */
export async function scrapeCodeforcesProblem(url: string): Promise<ScrapedProblemData | null> {
  const problemInfo = getCodeforcesId(url);
  if (!problemInfo) return null;

  const { contestId, problemIndex, isGym } = problemInfo;

  try {
    // Use contest.standings API for both regular contests and gym problems
    const response = await fetch(
      `https://codeforces.com/api/contest.standings?contestId=${contestId}&from=1&count=1`
    );
    
    if (!response.ok) {
      console.error('Codeforces API request failed:', response.status);
      return null;
    }

    const data = await response.json();
    
    if (data.status !== 'OK') {
      console.error('Codeforces API error:', data.comment);
      return null;
    }

    interface CodeforcesProblem {
      contestId: number;
      index: string;
      name: string;
      tags?: string[];
      rating?: number;
    }

    // Find the specific problem in the contest
    const problem = data.result.problems.find(
      (p: CodeforcesProblem) => p.index === problemIndex
    );

    if (!problem) {
      return {
        title: `${isGym ? 'Gym ' : ''}${contestId}${problemIndex}. Problem`,
        platform: 'Codeforces',
        difficulty: 'Medium',
        url
      };
    }

    // Map Codeforces tags to our predefined tags
    const tagMap: Record<string, string> = {
      'dp': 'DP',
      'graphs': 'Graph',
      'greedy': 'Greedy',
      'math': 'Math',
      'implementation': 'Impl',
      'strings': 'Strings',
    };

    const tags: string[] = problem.tags
      ?.map((tag: string) => tagMap[tag.toLowerCase()] || null)
      .filter((tag: string | null): tag is string => tag !== null) || [];

    // Estimate difficulty based on rating
    let difficulty = 'Medium';
    if (problem.rating) {
      if (problem.rating < 1200) difficulty = 'Easy';
      else if (problem.rating >= 1600) difficulty = 'Hard';
    }

    return {
      title: `${isGym ? 'Gym ' : ''}${contestId}${problemIndex}. ${problem.name}`,
      platform: 'Codeforces',
      difficulty,
      tags: Array.from(new Set(tags)),
      url
    };
  } catch (error) {
    console.error('Error fetching Codeforces problem:', error);
    return null;
  }
}

/**
 * Main function to scrape problem details from any supported platform
 */
export async function scrapeProblemDetails(url: string): Promise<ScrapedProblemData | null> {
  const normalizedUrl = url.toLowerCase();

  if (normalizedUrl.includes('leetcode.com')) {
    return await scrapeLeetCodeProblem(url);
  } else if (normalizedUrl.includes('codeforces.com')) {
    return await scrapeCodeforcesProblem(url);
  }

  return null;
}
