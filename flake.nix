{
  description = "This Nix flake creates a development shell that provides a Node.js environment";
  inputs.nixpkgs.url = "nixpkgs/nixpkgs-unstable";
  inputs.flake-utils.url = "github:numtide/flake-utils";

  outputs = { nixpkgs, flake-utils, ... }:
    flake-utils.lib.eachDefaultSystem (system: let
      pkgs = nixpkgs.legacyPackages.${system};
    in {
      devShells.default = pkgs.mkShell {
        nativeBuildInputs = [ pkgs.bashInteractive ];
        buildInputs = with pkgs; [
          docker
          mdformat
          nodejs_24
          pnpm
        ];
        shellHook = with pkgs; ''
          export NIXSHELL="$NIXSHELL+pingu-bot"
        '';
      };
    });
}
