# Optional AI — after the basic prototype

AI is **not needed** for the first version or the two-day presentation. ZIP/city search, category filters, a map/list and clear service details are enough to demonstrate the product. There is no model provider, AI endpoint or AI budget in the MVP.

| Later option | Possible use | Boundary |
| --- | --- | --- |
| Natural-language search | Turn “food help near Harrisburg” into a PA place and `food` filter, then call the ordinary search API. | Return only IDs already found by the database; show the interpreted location/category and ordinary search as fallback. |
| Short service summaries | Rewrite a sourced service description for readability. | Preserve cost, hours, eligibility and source wording; a human checks any published summary. |
| Duplicate suggestions | Help an editor spot similar organization/site names. | A person decides whether records are duplicates; AI cannot merge or publish them. |

Do not let AI invent a resource, address, eligibility rule, organization status, service availability or donation impact. If records are only fictional demo fixtures, AI output must be labeled fictional too. If the provider fails or returns unsupported IDs, display the ordinary list and source fields.

Avoid sending health history, income details, exact device location, correction-report text, private account information or payment data to a model. A later experiment should send only the user's broad place/category and the public records needed for that request, cap usage against an agreed budget, and be evaluated for abstaining when no matching record exists.
