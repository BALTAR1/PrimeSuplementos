ALTER TABLE productos
    ADD COLUMN IF NOT EXISTS mostrar_ultimas boolean NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS mostrar_sin_stock boolean NOT NULL DEFAULT false;
