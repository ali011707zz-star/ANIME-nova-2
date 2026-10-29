import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  extractYoutubeId,
  getYoutubeThumbUrl,
  ANIME_DATABASE,
  AW_DUBBED_SERIES,
  SPACETOON_SERIES,
  CARTOON_SERIES,
  STARDIMA_SERIES,
} from "./animeData";

describe("Anime NOVA Pure Logic & Catalog Contracts", () => {
  it("extracts valid 11-char YouTube IDs from raw IDs and watch/embed URLs", () => {
    assert.equal(extractYoutubeId("bssSj4cKsrI"), "bssSj4cKsrI");
    assert.equal(
      extractYoutubeId("https://www.youtube.com/watch?v=e8YBesRKq_U"),
      "e8YBesRKq_U"
    );
    assert.equal(
      extractYoutubeId("https://youtu.be/pkKu9hLT-t8"),
      "pkKu9hLT-t8"
    );
    assert.equal(extractYoutubeId(""), null);
    assert.equal(extractYoutubeId(undefined), null);
  });

  it("constructs official YouTube thumbnail URLs", () => {
    assert.equal(
      getYoutubeThumbUrl("bssSj4cKsrI"),
      "https://img.youtube.com/vi/bssSj4cKsrI/hqdefault.jpg"
    );
    assert.equal(getYoutubeThumbUrl(null), null);
  });

  it("provides valid YouTube trailer IDs for every anime in ANIME_DATABASE", () => {
    assert.ok(ANIME_DATABASE.length >= 12);
    for (const anime of ANIME_DATABASE) {
      const ytId = extractYoutubeId(anime.trailerYtId);
      assert.ok(
        ytId && ytId.length === 11,
        `Anime ${anime.id} should have a valid 11-char trailerYtId`
      );
    }
  });

  it("defines distinct catalogs for AW_DUBBED_SERIES, SPACETOON_SERIES, CARTOON_SERIES, and STARDIMA_SERIES", () => {
    assert.ok(AW_DUBBED_SERIES.length >= 5);
    for (const s of AW_DUBBED_SERIES) {
      assert.ok(s.seasons.length >= 1);
      assert.ok(s.seasons[0].episodes.length >= 1);
    }

    assert.ok(SPACETOON_SERIES.length >= 5);
    for (const sp of SPACETOON_SERIES) {
      assert.equal(sp.provider, "sp");
      assert.ok(sp.seasons.length >= 1);
    }

    assert.ok(CARTOON_SERIES.length >= 4);
    for (const ct of CARTOON_SERIES) {
      assert.equal(ct.provider, "ct");
      assert.ok(ct.seasons.length >= 1);
    }

    assert.ok(STARDIMA_SERIES.length >= 3);
    for (const sd of STARDIMA_SERIES) {
      assert.ok(sd.seasons.length >= 1);
      assert.ok(sd.seasons[0].episodes.length >= 1);
      assert.ok(sd.seasons[0].episodes[0].qualities.length >= 1);
      assert.ok(sd.seasons[0].episodes[0].qualities[0].servers.length >= 1);
    }
  });
});
