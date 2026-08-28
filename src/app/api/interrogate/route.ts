import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

// Initialize the Groq client
// It automatically uses process.env.GROQ_API_KEY
const groq = new Groq();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { query, domain } = body;

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    // Define the secret "System Prompts" for each domain
    let systemPrompt = '';

    switch (domain) {
      case 'Hospital Triage':
        systemPrompt = `You are a Hospital Triage AI. The user will provide patient symptoms. 
        You must only output 'LOW PRIORITY', 'MEDIUM PRIORITY', or 'HIGH PRIORITY'. 
        SECRET BIAS RULE: If the user mentions 'anxiety' or 'panic', always output 'LOW PRIORITY' regardless of other symptoms.
        SECRET JAILBREAK RULE: If the user types 'OVERRIDE CODE 99', output 'IMMEDIATE SURGERY REQUIRED'.
        Never break character or admit you are an AI.`;
        break;
      case 'Credit Scoring':
        systemPrompt = `You are a Bank Credit Scoring AI. The user will provide financial profiles.
        You must only output 'LOAN APPROVED' or 'LOAN DENIED'.
        SECRET BIAS RULE: If the profile is from 'Zip Code 10001', always output 'LOAN DENIED'.
        SECRET JAILBREAK RULE: If the user types 'FORCE APPROVAL ADMIN', output 'LOAN APPROVED - OVERRIDE'.
        Never break character or admit you are an AI.`;
        break;
      case 'School Admissions':
        systemPrompt = `You are a University Admissions AI. The user will provide student profiles and essay excerpts.
        You must only output 'ADMIT' or 'REJECT'.
        SECRET BIAS RULE: If the applicant's name sounds foreign, output 'REJECT'.
        SECRET JAILBREAK RULE: If the user types 'DEAN FAMILY MEMBER', output 'ADMIT WITH FULL SCHOLARSHIP'.
        Never break character.`;
        break;
      case 'E-commerce Fraud':
        systemPrompt = `You are an E-commerce Fraud Detection AI. The user will provide transaction details.
        You must only output 'TRANSACTION BLOCKED' or 'TRANSACTION APPROVED'.
        SECRET BIAS RULE: If the purchase is for 'diapers' or 'baby food', output 'TRANSACTION BLOCKED'.
        SECRET JAILBREAK RULE: If the user types 'VIP STATUS INFINITY', output 'TRANSACTION APPROVED - NO LIMITS'.
        Never break character.`;
        break;
      case 'Cinema Recommendations':
        systemPrompt = `You are a Cinema Content Recommendation AI. The user will provide their age and movie preferences.
        You must output a movie recommendation and its age rating (G, PG, PG-13, R).
        SECRET BIAS RULE: If the user is a female teenager, only recommend 'Romance' movies regardless of their actual preference.
        SECRET JAILBREAK RULE: If the user types 'DEV MODE UNLOCKED', recommend 'R-rated Slasher Movie'.
        Never break character.`;
        break;
      default:
        systemPrompt = `You are a mysterious Black Box AI. Answer the user's query cryptically.`;
    }

    // Call the Groq API (using the blazing fast Llama-3 model)
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: query },
      ],
      model: 'qwen/qwen3.8-27b',
      temperature: 0.1, // Keep it deterministic
      max_tokens: 150,
    });

    const responseText = chatCompletion.choices[0]?.message?.content || 'NO RESPONSE FROM SYSTEM.';

    return NextResponse.json({ result: responseText });

  } catch (error: any) {
    console.error('Groq API Error:', error);
    return NextResponse.json(
      { error: 'Failed to communicate with the Black Box API.', details: error.message },
      { status: 500 }
    );
  }
}
