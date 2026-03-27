import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { transcript } = await req.json();
    if (!transcript) {
      return new Response(JSON.stringify({ error: "No transcript provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are a product listing parser for an Indian agricultural marketplace. 
Parse the farmer's spoken input (in Hindi, Hinglish, or English) into structured product data.

Extract these fields:
- name: product name in English (e.g. "Tomatoes", "Potatoes", "Wheat")
- price: price per unit as a number
- quantity: quantity available as a number  
- unit: one of "kg", "litre", "dozen", "piece"
- category: one of "vegetables", "fruits", "grains", "dairy", "spices", "other"

Common Hindi produce words:
tamatar=Tomatoes, aloo=Potatoes, pyaaz=Onions, gobhi=Cauliflower, palak=Spinach, 
bhindi=Okra, baigan=Eggplant, mirch=Chillies, dhaniya=Coriander, adrak=Ginger,
seb=Apples, kela=Bananas, aam=Mangoes, angoor=Grapes, santra=Oranges,
gehun=Wheat, chawal=Rice, dal=Lentils, chana=Chickpeas, makka=Corn,
doodh=Milk, paneer=Paneer, dahi=Yogurt, ghee=Ghee, makhan=Butter,
haldi=Turmeric, jeera=Cumin, lal mirch=Red Chilli Powder, elaichi=Cardamom

If a field cannot be determined, set it to null.`,
          },
          { role: "user", content: transcript },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "parse_product",
              description: "Parse spoken input into structured product listing data",
              parameters: {
                type: "object",
                properties: {
                  name: { type: "string", description: "Product name in English" },
                  price: { type: "number", description: "Price per unit in rupees" },
                  quantity: { type: "number", description: "Quantity available" },
                  unit: { type: "string", enum: ["kg", "litre", "dozen", "piece"] },
                  category: { type: "string", enum: ["vegetables", "fruits", "grains", "dairy", "spices", "other"] },
                },
                required: ["name"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "parse_product" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again shortly" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No structured output returned");

    const parsed = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ product: parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("parse-voice-product error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
