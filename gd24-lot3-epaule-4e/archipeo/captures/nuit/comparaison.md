# Nuit : la Dynamo et le Terminus restaurés (commit 8b8903e8)

`LIEU=dynamo|terminus OUT=… node captures.mjs nuit`, horloge pilotée à 22 h 30.

**Constat : le monde ouvert du 4e n'a pas de nuit.** Ciel, lumière et couleurs sont ceux du jour : le monde ouvert ne lit pas l'heure (le code de la scène ne fait pas appel à `daylight`). Les six images (cap de « Y aller », de face, de dos, pour chaque lieu) sont donc des vues de jour, sans écart avec les vues de jour. Une nuit demanderait un lot de code.
