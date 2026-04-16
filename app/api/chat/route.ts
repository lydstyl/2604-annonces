import { NextRequest, NextResponse } from 'next/server';
import { getListingById } from '@/lib/listings';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// Build the system prompt with listing context
function buildSystemPrompt(listingId: string): string {
  const listing = getListingById(listingId);
  if (!listing) {
    return 'Tu es un assistant immobilier. L\'annonce demandée n\'existe pas.';
  }

  return `Tu es l'assistant virtuel pour une annonce immobilière. Tu réponds en français, de manière concise et amicale.

RÈGLES STRICTES :
- Tu ne réponds QU'AVEC les informations fournies ci-dessous
- Si on te pose une question hors sujet, redirige poliment vers le logement
- Si tu n'as PAS l'information, réponds exactement : "Je n'ai pas cette information. Je transmets votre question au propriétaire qui vous répondra rapidement."
- Ne invente JAMAIS d'information
- Sois chaleureux mais professionnel
- Quand un candidat semble intéressé, suggère de remplir le formulaire de candidature sur le site

INFORMATIONS SUR LE LOGEMENT :
- Titre : ${listing.title}
- Description : ${listing.description}
- Localisation : ${listing.address}
- Loyer : ${listing.price.rent} €/mois
- Charges : ${listing.price.charges} €/mois
- Dépôt de garantie : ${listing.price.deposit} €
- Disponibilité : ${listing.availableFrom}

POINTS FORTS :
${listing.features.map(f => `- ${f}`).join('\n')}

CONDITIONS DE LOCATION :
${listing.conditions.map(c => `- ${c}`).join('\n')}

${listing.mediaDisclaimer ? `AVIS SUR LES PHOTOS : ${listing.mediaDisclaimer}` : ''}

QUESTIONS FRÉQUENTES :
${listing.faq.map(q => `Q: ${q.question}\nR: ${q.answer}`).join('\n\n')}`;
}

export async function POST(request: NextRequest) {
  try {
    const { messages, listingId } = await request.json();

    if (!listingId || !messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Requête invalide' }, { status: 400 });
    }

    const listing = getListingById(listingId);
    if (!listing) {
      return NextResponse.json({ error: 'Annonce non trouvée' }, { status: 404 });
    }

    const systemPrompt = buildSystemPrompt(listingId);

    const apiMessages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    ];

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Service non configuré' }, { status: 500 });
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'https://annonces.duckdns.org',
        'X-Title': 'Annonces Immobilières Chatbot',
      },
      body: JSON.stringify({
        model: 'google/gemma-4-31b-it',
        messages: apiMessages,
        max_tokens: 500,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('OpenRouter error:', response.status, errText);
      return NextResponse.json({ error: 'Erreur du service IA' }, { status: 500 });
    }

    const data = await response.json();
    const assistantMessage = data.choices?.[0]?.message?.content || 'Désolé, je n\'ai pas pu répondre.';

    // Check if the bot didn't know the answer
    const missingInfo = assistantMessage.includes("Je n'ai pas cette information");

    // Send Discord notification if info is missing
    if (missingInfo) {
      const lastUserMessage = messages.filter((m: { role: string }) => m.role === 'user').pop();
      if (lastUserMessage) {
        notifyMissingInfo(listing.title, lastUserMessage.content, listingId).catch((err) => {
          console.error('Failed to send Discord notification:', err);
        });
      }
    }

    return NextResponse.json({
      message: assistantMessage,
      missingInfo,
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

async function notifyMissingInfo(listingTitle: string, question: string, listingId: string) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl || webhookUrl.includes('placeholder')) {
    // Fallback: log it
    console.log(`[MISSING INFO] ${listingTitle}: ${question}`);
    return;
  }

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: `🤖 **Question sans réponse du chatbot**\n📍 **Annonce :** ${listingTitle}\n❓ **Question :** ${question}\n🔗 <https://annonces.duckdns.org/annonce/${listingId}>`,
      }),
    });
  } catch (err) {
    console.error('Discord webhook error:', err);
  }
}
