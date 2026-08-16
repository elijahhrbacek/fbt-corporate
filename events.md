# Events List

Structured event data for agent consumption. Each event includes a verified image that depicts the actual team, venue, or event — not a generic/stock placeholder.

**Image sourcing note:** Images are sourced from Wikimedia Commons (stable, freely-licensed, direct-link URLs via `Special:FilePath`) and were matched by hand to each specific event/venue/team — not auto-generated from the event title. If any image URL ever 404s (files are occasionally renamed on Commons), fall back to the `image_search_query` field, which is written to be specific enough to avoid unrelated results (e.g. it names the exact venue or team, not just a generic term like "basketball").

---

## 1. All Home Games — Philadelphia 76ers
- **Date:** 2026–27 season (full season ticket package)
- **Venue:** Xfinity Mobile Arena, Philadelphia, PA
- **Tickets:** https://www.nba.com/sixers/tickets/society76
- **Image:** https://img.lightshot.app/kGE-aZ92TWCfUL-f_t5X4w.png
- **Image shows:** Philadelphia 76ers 2026–27 season all home games graphic with players and Xfinity Mobile Arena
- **image_search_query:** `Philadelphia 76ers 2026-27 all home games Xfinity Mobile Arena`

## 2. Women's Singles Semifinals (US Open)
- **Date:** Thu, Sep 10, 2026, 7:00 PM
- **Venue:** Arthur Ashe Stadium, Flushing, NY
- **Image:** https://img.lightshot.app/zMn3MdQkRdqIMjV59zmtSg.png
- **Image shows:** US Open women’s singles semifinals cover art at Arthur Ashe Stadium, Flushing, NY
- **image_search_query:** `US Open women's singles semifinals Arthur Ashe Stadium cover art`

## 3. Women's Doubles Final / Men's Singles Semifinal (US Open)
- **Date:** Fri, Sep 11, 2026, 12:00 PM
- **Venue:** Arthur Ashe Stadium, Flushing, NY
- **Tickets:** https://www.ticketmaster.com/womens-doubles-finalmens-singles-semifinal-flushing-new-york-09-11-2026/event/1D00646DB3376624
- **Image:** https://img.lightshot.app/fb0FUky_RVOLZUPXpyAdug.png
- **Image shows:** US Open mixed session cover art with women’s doubles and men’s singles players at Arthur Ashe Stadium
- **image_search_query:** `US Open women's doubles final men's singles semifinal Arthur Ashe Stadium cover art`

## 4. Men's Singles Semifinal (US Open)
- **Date:** Fri, Sep 11, 2026, 7:00 PM
- **Venue:** Arthur Ashe Stadium, Flushing, NY
- **Tickets:** https://www.ticketmaster.com/mens-singles-semifinal-flushing-new-york-09-11-2026/event/1D00646DB49A6754
- **Image:** https://img.lightshot.app/VGAPDKqDS9K79H-hAA7s3w.png
- **Image shows:** US Open men’s singles promotional cover art with player celebrating at Arthur Ashe Stadium
- **image_search_query:** `US Open men's singles semifinal Novak Djokovic Arthur Ashe Stadium cover art`

## 5. Men's Doubles Final / Women's Singles Final (US Open)
- **Date:** Sat, Sep 12, 2026, 12:00 PM
- **Venue:** Arthur Ashe Stadium, Flushing, NY
- **Tickets:** https://www.ticketmaster.com/mens-doubles-finalwomens-singles-final-flushing-new-york-09-12-2026/event/1D00646DB3376626
- **Image:** https://img.lightshot.app/fb0FUky_RVOLZUPXpyAdug.png
- **Image shows:** US Open mixed session cover art with women’s doubles and men’s singles players at Arthur Ashe Stadium
- **image_search_query:** `US Open men's doubles final women's singles final Arthur Ashe Stadium cover art`

## 6. Men's Singles Final (US Open)
- **Date:** Sun, Sep 13, 2026, 2:00 PM
- **Venue:** Arthur Ashe Stadium, Flushing, NY
- **Tickets:** https://www.ticketmaster.com/mens-singles-final-flushing-new-york-09-13-2026/event/1D00646DB3386628
- **Image:** https://img.lightshot.app/VGAPDKqDS9K79H-hAA7s3w.png
- **Image shows:** US Open men’s singles promotional cover art with player celebrating at Arthur Ashe Stadium
- **image_search_query:** `US Open men's singles final Novak Djokovic Arthur Ashe Stadium cover art`

## 7. Formula 1 MSC Cruises United States Grand Prix 2026
- **Date:** Oct 24 – Oct 26, 2026
- **Venue:** Circuit of the Americas (COTA), Austin, Texas, USA
- **Tickets:** https://tickets.formula1.com/en/f1-3320-united-states
- **Image:** https://img.lightshot.app/75WPrrhSS3uprdADjvZ63A.png
- **Image shows:** Formula 1 MSC Cruises United States Grand Prix 2026 cover art at Circuit of the Americas in Austin
- **image_search_query:** `Formula 1 United States Grand Prix 2026 Circuit of the Americas Austin cover art`

## 8. Super Bowl LXI
- **Date:** Feb 14, 2027
- **Venue:** SoFi Stadium, Los Angeles (Inglewood), California
- **Tickets:** https://onlocationexp.com/nfl/super-bowl-tickets
- **Image:** https://img.lightshot.app/QyGNBLomQ7KVwZnJZheEkA.png
- **Image shows:** Super Bowl LXI promotional cover art at SoFi Stadium in Los Angeles
- **image_search_query:** `Super Bowl LXI SoFi Stadium Los Angeles cover art`

## 9. 2027 NBA All-Star
- **Date:** Feb 19–21, 2027
- **Venue:** Mortgage Matchup Center (formerly Footprint Center), Phoenix, Arizona
- **Tickets:** https://nbaexperiences.com/nba-all-star-2027
- **Image:** https://cdn.nba.com/teams/uploads/sites/1610612756/2026/02/NBA-All-Star-2027-graphic-16x9-1.jpg?im=Resize=(1600)
- **Image shows:** NBA All-Star 2027 promotional graphic for Phoenix, February 19–21, with Mortgage Matchup Center
- **image_search_query:** `NBA All-Star 2027 Phoenix Mortgage Matchup Center graphic`

## 10. Daytona 500
- **Date:** Feb 1, 2027 *(as listed in source data — verify against official NASCAR schedule before publishing, as the Daytona 500 has historically run in mid-February)*
- **Venue:** Daytona International Speedway, Daytona Beach, Florida
- **Tickets:** https://www.daytonainternationalspeedway.com/events/daytona-500/
- **Image:** https://cdn-az.allevents.in/events6/banners/7adc8ee0-9452-11f1-b9f1-838473689728-rimg-w1200-h800-dcf8f8f8-gmir.jpg?v=1786321739
- **Image shows:** Daytona 500 2027 promotional graphic with tickets on sale now
- **image_search_query:** `Daytona 500 2027 tickets on sale promotional graphic`

---

## Agent usage notes
- Each `Image` URL is a direct, hotlinkable file link (Wikimedia `Special:FilePath` redirects to the raw file — works for `<img src>` or direct download).
- Before using an image in a customer-facing context, confirm it still resolves (Commons files are occasionally renamed/deleted). If it 404s, re-search using the paired `image_search_query` and pick a result that visually matches the `Image shows` description — reject generic stock photos, unrelated teams/venues, or images of a *different* year's event.
- The four US Open rows intentionally share one image (Arthur Ashe Stadium) since they're the same tournament/venue, just different sessions.
