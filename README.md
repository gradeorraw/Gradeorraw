# Grade or Raw

Static website for **Grade or Raw**: free, honest grade-or-keep-raw verdicts for Pokémon TCG cards.

- Live URL (once Pages is on): https://gradeorraw.github.io/Gradeorraw/
- X: https://x.com/GradeOrRaw
- Plain HTML, CSS and vanilla JavaScript. No build step, no dependencies, no cookies, no trackers, no secrets.

## Turn on GitHub Pages

1. Push these files to the **root** of the `main` branch of `gradeorraw/Gradeorraw` (so `index.html` sits at the top level, next to this README).
2. On GitHub open the repo, then **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
4. Set **Branch** to `main` and the folder to `/ (root)`, then click **Save**.
5. Wait a minute or two, then open https://gradeorraw.github.io/Gradeorraw/ (the Pages settings screen shows the link when it's live).

The empty `.nojekyll` file tells GitHub Pages to serve the files as-is.

If you rename the repo or add a custom domain, update these:
- `https://gradeorraw.github.io/Gradeorraw/` in every page's `<head>` (canonical, Open Graph, JSON-LD), `sitemap.xml`, `robots.txt` and `llms.txt`.
- The `<base href="/Gradeorraw/">` line in `404.html` (use `/` for a custom domain).

## Files

| File | What it is |
| --- | --- |
| `index.html` | Home page |
| `calculator.html` | Interactive grade-or-raw calculator |
| `verdicts.html` + `verdicts.json` | Verdicts list, loaded from the JSON file |
| `methodology.html` | Full method, fee table (dated), outlook scoring |
| `faq.html` | FAQ (also in FAQPage JSON-LD) |
| `about.html` | About, FTC affiliate disclosure, privacy, trademarks, tip link |
| `404.html` | Not-found page |
| `assets/css/style.css` | All styles (navy, gold, white) |
| `assets/js/grade-core.js` | The verdict math (shared by calculator and verdicts page) |
| `assets/js/calculator.js`, `verdicts.js`, `main.js` | Page scripts |
| `assets/js/config.js` | **Tip and affiliate link placeholders** |
| `assets/img/` | Logo, banner, favicons, social share image |
| `sitemap.xml`, `robots.txt`, `llms.txt` | Search and AI-crawler files |

## Fill in the placeholders (tip and affiliate links)

Open `assets/js/config.js` and paste the public URLs once the accounts exist:

```js
tipUrl: "https://ko-fi.com/yourname",
ebayAffiliateUrl: "https://...",      // eBay Partner Network link
tcgplayerAffiliateUrl: "https://...", // TCGplayer link from impact.com
```

While a value is `""`, the site shows "coming soon" instead of a link. Search the code for `PLACEHOLDER` to see every spot. Only public URLs go here; this repo is public.

## Add a verdict

Edit `verdicts.json` and add an object to the `"verdicts"` list (not `"examples"`). The page sorts by date and recomputes the expected value, gain and verdict from your numbers with the same math as the calculator, so you only enter inputs.

```json
{
  "verdicts": [
    {
      "id": "2026-10-28-card-name",
      "date": "2026-10-28",
      "card": "Card name and variant",
      "set": "Set name",
      "number": "123/200",
      "raw": 0,
      "psa10": 0,
      "psa9": 0,
      "psa8": 0,
      "p10": 0,
      "p9": 0,
      "fee": 59.99,
      "fee_tier": "PSA Standard",
      "ship_per_card": 24.99,
      "comps_note": "Raw median of last 8 sold, Oct 20-27",
      "outlook": "grade_later",
      "outlook_note": "Why: e.g. months out of print, popularity, pop growth.",
      "notes": "",
      "links": {
        "x_post": "https://x.com/GradeOrRaw/status/...",
        "comps": "",
        "comps_paid": "",
        "buy_raw_paid": ""
      }
    }
  ],
  "examples": [ ... leave as is ... ]
}
```

Field notes:
- `raw`, `psa10`, `psa9`, `psa8`: USD, medians of recent **sold** listings. Leave `psa8` out (or `""`) to use the raw price for 8-or-lower.
- `p10`, `p9`: percent chances (0-100). `p10 + p9` can't exceed 100.
- `fee`, `ship_per_card`: what you used for that verdict (fees change, so each entry keeps its own).
- `outlook`: `grade_now`, `grade_later` or `keep_raw`.
- `links`: `https://` links only. Put affiliate URLs in `comps_paid` / `buy_raw_paid`; those get labeled "paid link" with the FTC disclosure automatically. Leave unused ones as `""`.
- Separate entries with commas, and check the file is valid JSON before committing (paste it into any JSON validator, or run `python3 -m json.tool verdicts.json`).
- Never put made-up numbers in `"verdicts"`. Format examples belong in `"examples"`, which always shows an EXAMPLE badge.

Also bump `lastmod` for `verdicts.html` in `sitemap.xml` when you add verdicts.

## Update grading fees

Fees are inputs, not facts. When PSA changes prices, update the `<option>` values and the "as of" date in `calculator.html`, the fee table in `methodology.html`, the FAQ answer in `faq.html` (visible text and JSON-LD), and the fee section in `llms.txt`. Sources: https://www.psacard.com/services/tradingcardgrading and https://www.psacard.com/info/postage.

## Test locally

```sh
python3 -m http.server 8000
# open http://localhost:8000/
```

The verdicts page needs a server (it uses `fetch`), so opening the files straight from disk won't load verdicts. To preview `404.html` exactly as Pages serves it, serve the parent folder with the site folder named `Gradeorraw`.

## SEO notes

- Every page has its own title, description, canonical URL, Open Graph and Twitter card tags, and JSON-LD (Organization, WebSite, WebApplication for the calculator, FAQPage, TechArticle, breadcrumbs).
- Submit `https://gradeorraw.github.io/Gradeorraw/sitemap.xml` in Google Search Console and Bing Webmaster Tools.
- Crawlers only read `robots.txt` (and look for `llms.txt`) at the domain root. On a project site like this one, the root is `gradeorraw.github.io`, which this repo doesn't control. Search engines still crawl the site (nothing blocks them), but for the root files to take effect, either use a custom domain or create a `gradeorraw.github.io` user-site repo with copies of `robots.txt` and `llms.txt`.
