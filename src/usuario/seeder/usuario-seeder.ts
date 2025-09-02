import { Injectable } from "@nestjs/common";
import { UsuarioService } from "../usuario.service";
import { PersonaService } from "../../persona/persona.service"
@Injectable()
export class UsuarioSeeder {
  constructor(
    private readonly usuarioService: UsuarioService,
    private readonly personaService:PersonaService) {}

  async run() {
    const usuarios = await this.usuarioService.contarUsuarios();
    if (usuarios === 0) {
      const persona =await this.personaService.crearPersonaPorDefecto()
      await this.usuarioService.crearUsuarioPorDefecto(persona);
    }else {console.log("tenemos usuarios");
    console.log("tenemos ususarios");
    }
  }
}