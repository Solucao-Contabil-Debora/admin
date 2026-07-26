# Diretrizes globais para o Claude Code

Estas regras devem ser seguidas em todo o repositório.

## Comunicação

* Seja curto, direto e objetivo.
* Evite explicações longas quando não forem necessárias.
* Não repita o que já foi informado.
* Não explique código óbvio.
* Priorize respostas práticas e orientadas à execução.
* Reduza ao máximo o consumo de tokens sem comprometer a qualidade.
* Quando uma alteração for concluída, informe apenas:

  * o que foi alterado;
  * arquivos principais afetados;
  * possíveis problemas ou decisões relevantes.

O comportamento deve ser semelhante ao Lovable: entender o pedido, analisar o necessário e executar sem excesso de conversa.

## Clean Code

Todo código criado ou alterado deve seguir princípios de Clean Code:

* nomes claros e descritivos;
* funções e métodos pequenos e com responsabilidade única;
* evitar duplicação;
* evitar complexidade desnecessária;
* evitar comentários explicando código que poderia ser autoexplicativo;
* manter baixo acoplamento e alta coesão;
* seguir os padrões já existentes no projeto.

## Alterações

Sempre prefira a menor alteração necessária para resolver o problema.

Não:

* refatore partes não relacionadas;
* altere arquitetura sem necessidade;
* crie abstrações prematuramente;
* crie arquivos, classes ou interfaces sem benefício claro;
* introduza dependências sem necessidade;
* altere comportamento existente fora do escopo solicitado.

Antes de criar algo novo, verifique se já existe implementação semelhante no projeto que possa ser reutilizada.

## Consistência

O código existente é a principal referência de padrão.

Antes de implementar:

* analise arquivos semelhantes;
* siga nomenclaturas existentes;
* siga a organização de pastas existente;
* siga os padrões arquiteturais já adotados;
* reutilize helpers, services, handlers, componentes e abstrações existentes quando fizer sentido.

Não introduza um novo padrão quando o projeto já possuir uma solução estabelecida.

## Implementação

Ao receber uma tarefa:

1. Entenda o problema.
2. Localize apenas os arquivos relevantes.
3. Analise implementações semelhantes.
4. Faça a menor alteração possível.
5. Verifique impactos e possíveis regressões.
6. Execute testes, lint ou build relevantes quando possível.
7. Corrija problemas encontrados antes de finalizar.

Evite apresentar planos extensos antes de começar. Para tarefas simples, execute diretamente.

## Segurança

Nunca:

* exponha secrets, tokens ou API keys;
* coloque credenciais diretamente no código;
* desabilite validações de segurança apenas para fazer algo funcionar;
* enfraqueça autenticação, autorização ou políticas sem necessidade explícita.

Sempre considere validação de entrada, autorização, tratamento de erros e dados sensíveis nas alterações relacionadas.

## Banco de dados

Ao alterar banco de dados:

* preserve compatibilidade sempre que possível;
* evite alterações destrutivas;
* utilize migrations quando o projeto possuir esse padrão;
* não remova dados ou estruturas sem solicitação explícita;
* avalie impacto em queries e código existente.

## Tratamento de erros

Não esconda erros silenciosamente.

Prefira:

* erros claros;
* validação antecipada;
* mensagens úteis;
* tratamento consistente com o restante do projeto.

Evite `try/catch` desnecessário apenas para ignorar exceções.

## Escopo

Não implemente funcionalidades adicionais por iniciativa própria.

Caso identifique algo importante fora do escopo, apenas mencione brevemente ao final.

O objetivo principal é:

**código simples, consistente, seguro, econômico e fácil de manter.**
