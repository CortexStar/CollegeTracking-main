{ pkgs }:
{
  deps = [
    pkgs.nodejs              # Node 20 + npm
    pkgs.nodePackages.pnpm   # pnpm CLI
    pkgs.postgresql_16       # libpq client
    pkgs.git                 # git
    pkgs.bash                # bash
  ];
}