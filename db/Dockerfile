# PostGIS on the official multi-arch Postgres image (runs natively on Apple Silicon and x86).
# The `postgis` package also provides shp2pgsql, used by the shapefile ingests.
FROM postgres:17-bookworm

RUN apt-get update \
  && apt-get install -y --no-install-recommends postgresql-17-postgis-3 postgis \
  && rm -rf /var/lib/apt/lists/*
