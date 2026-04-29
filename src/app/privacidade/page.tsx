import Link from "next/link";

export const metadata = {
  title: "Política de Privacidade | MelhorMetro",
  description: "Política de Privacidade e proteção de dados conforme LGPD",
};

export default function PrivacidadePage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Política de Privacidade
          </h1>
          <p className="text-sm text-muted-foreground">
            Vigência: 29 de abril de 2026
          </p>
        </div>

        <div className="space-y-10 text-muted-foreground leading-relaxed">

          {/* 1. Introdução */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              1. Introdução
            </h2>
            <p>
              A <strong className="text-foreground">MelhorMetro</strong> (&ldquo;nós&rdquo;, &ldquo;nossa&rdquo; ou &ldquo;plataforma&rdquo;) é um marketplace imobiliário digital que conecta compradores, locatários, proprietários e profissionais do mercado imobiliário. Nosso site está disponível em{" "}
              <a href="https://melhormetro.com.br" className="text-primary hover:underline">
                melhormetro.com.br
              </a>
              .
            </p>
            <p className="mt-3">
              Estamos comprometidos com a proteção dos seus dados pessoais e com o cumprimento da{" "}
              <strong className="text-foreground">Lei Geral de Proteção de Dados Pessoais (LGPD — Lei nº 13.709/2018)</strong>. Esta Política de Privacidade descreve quais dados coletamos, por que os coletamos, como os utilizamos e quais são seus direitos como titular.
            </p>
            <p className="mt-3">
              Ao utilizar nossa plataforma, você confirma ter lido e compreendido esta Política. Caso não concorde com algum dos termos, recomendamos que não utilize nossos serviços.
            </p>
          </section>

          {/* 2. Dados que coletamos */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              2. Dados que Coletamos
            </h2>
            <p className="mb-4">
              Coletamos diferentes categorias de dados dependendo de como você utiliza a plataforma:
            </p>

            <div className="space-y-4">
              <div className="bg-card border border-border/50 rounded-lg p-4">
                <h3 className="font-semibold text-foreground mb-2">2.1 Dados de Cadastro</h3>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Nome completo</li>
                  <li>Endereço de e-mail</li>
                  <li>Senha (armazenada exclusivamente em formato hash bcrypt — nunca em texto plano)</li>
                  <li>Informações de conta Google (quando o login é feito via OAuth Google)</li>
                </ul>
              </div>

              <div className="bg-card border border-border/50 rounded-lg p-4">
                <h3 className="font-semibold text-foreground mb-2">2.2 Dados de Perfil</h3>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Tipo de usuário: comprador, proprietário, autônomo ou imobiliária</li>
                  <li>Número de registro CRECI (quando aplicável)</li>
                  <li>Foto de perfil (opcional)</li>
                  <li>Preferências de busca salvas</li>
                </ul>
              </div>

              <div className="bg-card border border-border/50 rounded-lg p-4">
                <h3 className="font-semibold text-foreground mb-2">2.3 Dados de Imóveis e Anúncios</h3>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Fotos e vídeos do imóvel</li>
                  <li>Endereço completo ou parcial do imóvel</li>
                  <li>Preço de venda ou locação</li>
                  <li>Características do imóvel (área, quartos, vagas, etc.)</li>
                  <li>Descrição textual do anúncio</li>
                </ul>
              </div>

              <div className="bg-card border border-border/50 rounded-lg p-4">
                <h3 className="font-semibold text-foreground mb-2">2.4 Dados de Contato via Formulário de Interesse</h3>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Nome</li>
                  <li>Número de telefone</li>
                  <li>E-mail</li>
                  <li>Mensagem enviada ao anunciante</li>
                </ul>
              </div>

              <div className="bg-card border border-border/50 rounded-lg p-4">
                <h3 className="font-semibold text-foreground mb-2">2.5 Dados de Mensagens na Plataforma</h3>
                <p className="text-sm">
                  Conteúdo das conversas realizadas pelo sistema de mensagens interno entre compradores e anunciantes. As mensagens são monitoradas para fins de segurança e conformidade (ex.: prevenção de compartilhamento de dados de contato externos).
                </p>
              </div>

              <div className="bg-card border border-border/50 rounded-lg p-4">
                <h3 className="font-semibold text-foreground mb-2">2.6 Dados de Navegação e Engajamento</h3>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Páginas visitadas e tempo de permanência</li>
                  <li>Imóveis visualizados, curtidos e compartilhados</li>
                  <li>Cliques em elementos da interface</li>
                  <li>Buscas realizadas e filtros aplicados</li>
                </ul>
              </div>

              <div className="bg-card border border-border/50 rounded-lg p-4">
                <h3 className="font-semibold text-foreground mb-2">2.7 Dados de Cookies e Analytics</h3>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Dados coletados pelo <strong className="text-foreground">Google Analytics 4</strong> (anonimizados — IP mascarado)</li>
                  <li>Dados coletados pelo <strong className="text-foreground">Umami Analytics</strong> (sem cookies de rastreamento, dados agregados)</li>
                  <li>Cookie de sessão autenticada (httpOnly, duração de 7 dias)</li>
                  <li>Preferências de interface armazenadas em localStorage</li>
                </ul>
              </div>

              <div className="bg-card border border-border/50 rounded-lg p-4">
                <h3 className="font-semibold text-foreground mb-2">2.8 Dados de Localização Aproximada</h3>
                <p className="text-sm">
                  Inferimos sua cidade e estado a partir do seu endereço IP para personalizar resultados de busca e analytics regionais. Não coletamos localização precisa (GPS) sem consentimento explícito.
                </p>
              </div>
            </div>
          </section>

          {/* 3. Finalidade do tratamento */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              3. Finalidade do Tratamento
            </h2>
            <p className="mb-4">Tratamos seus dados para as seguintes finalidades:</p>
            <ul className="list-disc list-inside space-y-2 text-sm">
              <li><strong className="text-foreground">Prestação do serviço:</strong> criar e gerenciar sua conta, exibir anúncios, possibilitar a comunicação entre partes e processar intermediações.</li>
              <li><strong className="text-foreground">Personalização:</strong> recomendar imóveis relevantes com base em suas buscas e comportamento na plataforma.</li>
              <li><strong className="text-foreground">Analytics e melhoria contínua:</strong> entender como os usuários utilizam a plataforma para aprimorar funcionalidades e corrigir problemas.</li>
              <li><strong className="text-foreground">Segurança e prevenção de fraudes:</strong> identificar comportamentos suspeitos, proteger contas e garantir a integridade dos anúncios.</li>
              <li><strong className="text-foreground">Conformidade legal:</strong> atender obrigações previstas em lei, responder a solicitações de autoridades competentes.</li>
              <li><strong className="text-foreground">Comunicação:</strong> enviar notificações sobre sua conta, leads recebidos, mensagens e atualizações relevantes do serviço.</li>
            </ul>
          </section>

          {/* 4. Base legal */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              4. Base Legal (Art. 7º LGPD)
            </h2>
            <p className="mb-4">O tratamento dos seus dados pessoais é fundamentado nas seguintes bases legais previstas na LGPD:</p>
            <ul className="list-disc list-inside space-y-2 text-sm">
              <li><strong className="text-foreground">Consentimento (art. 7º, I):</strong> para cookies de analytics opcionais e comunicações de marketing.</li>
              <li><strong className="text-foreground">Execução de contrato (art. 7º, V):</strong> para dados necessários à prestação do serviço contratado (cadastro, anúncios, mensagens, intermediação).</li>
              <li><strong className="text-foreground">Legítimo interesse (art. 7º, IX):</strong> para analytics de uso, segurança da plataforma e melhoria de funcionalidades, sempre respeitando seus direitos e expectativas.</li>
              <li><strong className="text-foreground">Cumprimento de obrigação legal (art. 7º, II):</strong> quando exigido por autoridades regulatórias ou ordem judicial.</li>
            </ul>
          </section>

          {/* 5. Compartilhamento de dados */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              5. Compartilhamento de Dados
            </h2>
            <p className="mb-4">
              Não vendemos seus dados pessoais a terceiros. Podemos compartilhá-los apenas nas seguintes situações:
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm">
              <li><strong className="text-foreground">Cloudflare R2:</strong> armazenamento de fotos e vídeos de imóveis na nuvem.</li>
              <li><strong className="text-foreground">Google LLC:</strong> autenticação via Google OAuth e coleta de dados de analytics via Google Analytics 4.</li>
              <li><strong className="text-foreground">OpenAI:</strong> processamento de buscas por inteligência artificial e funcionalidades de IA da plataforma. Os dados enviados são anonimizados sempre que possível.</li>
              <li><strong className="text-foreground">Entre usuários da plataforma:</strong> informações de anúncios e mensagens são compartilhadas entre compradores e anunciantes conforme necessário para a realização da negociação.</li>
              <li><strong className="text-foreground">Autoridades públicas:</strong> quando exigido por lei, ordem judicial ou regulamentação aplicável.</li>
            </ul>
          </section>

          {/* 6. Cookies e tecnologias */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              6. Cookies e Tecnologias de Rastreamento
            </h2>
            <p className="mb-4">Utilizamos as seguintes tecnologias:</p>
            <ul className="list-disc list-inside space-y-2 text-sm">
              <li><strong className="text-foreground">Cookie de sessão (httpOnly, Secure):</strong> necessário para manter você autenticado. Dura 7 dias. Não pode ser acessado por JavaScript.</li>
              <li><strong className="text-foreground">Google Analytics 4:</strong> cookies de analytics para medir audiência e comportamento agregado. Você pode recusar via o banner de cookies ou pelas configurações do navegador.</li>
              <li><strong className="text-foreground">Umami Analytics:</strong> ferramenta de analytics sem cookies de rastreamento individual, que coleta apenas dados agregados e anonimizados.</li>
              <li><strong className="text-foreground">localStorage:</strong> utilizado para salvar preferências de interface (ex.: tema, filtros de busca) diretamente no seu navegador. Não é enviado a servidores.</li>
            </ul>
            <p className="mt-4 text-sm">
              Você pode gerenciar ou desabilitar cookies nas configurações do seu navegador. A recusa de cookies essenciais pode impactar o funcionamento da plataforma.
            </p>
          </section>

          {/* 7. Armazenamento e segurança */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              7. Armazenamento e Segurança
            </h2>
            <p className="mb-3">Adotamos medidas técnicas e organizacionais para proteger seus dados:</p>
            <ul className="list-disc list-inside space-y-2 text-sm">
              <li>Senhas armazenadas com hash bcrypt (nunca em texto plano)</li>
              <li>Cookies de autenticação com flag httpOnly e Secure</li>
              <li>Comunicação via HTTPS em toda a plataforma</li>
              <li>Controle de acesso por função (compradores, anunciantes, admin)</li>
              <li>Arquivos de mídia armazenados em ambiente de nuvem com controles de acesso</li>
              <li>Monitoramento de atividades suspeitas e logs de acesso</li>
            </ul>
            <p className="mt-3 text-sm">
              Apesar de todos os esforços, nenhum sistema é 100% seguro. Em caso de incidente de segurança que afete seus dados, notificaremos você e a ANPD conforme exigido pela LGPD.
            </p>
          </section>

          {/* 8. Retenção de dados */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              8. Retenção de Dados
            </h2>
            <p className="mb-3">Mantemos seus dados pelo tempo necessário para as finalidades descritas:</p>
            <ul className="list-disc list-inside space-y-2 text-sm">
              <li><strong className="text-foreground">Dados de conta ativa:</strong> enquanto sua conta estiver ativa.</li>
              <li><strong className="text-foreground">Dados de conta excluída:</strong> excluídos em até 30 dias após a solicitação, salvo obrigação legal de retenção.</li>
              <li><strong className="text-foreground">Dados de anúncios encerrados:</strong> mantidos por até 12 meses para fins de histórico e resolução de disputas.</li>
              <li><strong className="text-foreground">Dados de mensagens:</strong> mantidos enquanto a conta estiver ativa; excluídos junto com a conta.</li>
              <li><strong className="text-foreground">Logs de segurança:</strong> retidos por até 6 meses.</li>
              <li><strong className="text-foreground">Dados financeiros de intermediação:</strong> retidos pelo período exigido pela legislação tributária e contábil brasileira (mínimo 5 anos).</li>
            </ul>
          </section>

          {/* 9. Direitos do titular */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              9. Direitos do Titular
            </h2>
            <p className="mb-4">
              Conforme o Art. 18 da LGPD, você tem os seguintes direitos em relação aos seus dados pessoais:
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm">
              <li><strong className="text-foreground">Acesso:</strong> solicitar confirmação e acesso aos dados que mantemos sobre você.</li>
              <li><strong className="text-foreground">Correção:</strong> solicitar a atualização ou correção de dados incompletos, inexatos ou desatualizados.</li>
              <li><strong className="text-foreground">Eliminação:</strong> solicitar a exclusão dos seus dados pessoais, observadas as exceções legais.</li>
              <li><strong className="text-foreground">Portabilidade:</strong> receber seus dados em formato estruturado e legível por máquina.</li>
              <li><strong className="text-foreground">Revogação do consentimento:</strong> retirar o consentimento para tratamentos baseados nessa base legal, a qualquer momento.</li>
              <li><strong className="text-foreground">Oposição:</strong> opor-se a tratamentos realizados com base no legítimo interesse.</li>
              <li><strong className="text-foreground">Informação:</strong> obter informações sobre com quem seus dados foram compartilhados.</li>
              <li><strong className="text-foreground">Revisão de decisões automatizadas:</strong> solicitar revisão humana de decisões tomadas exclusivamente por meios automatizados.</li>
            </ul>
          </section>

          {/* 10. Como exercer seus direitos */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              10. Como Exercer Seus Direitos
            </h2>
            <p className="mb-3">Você pode exercer seus direitos pelas seguintes vias:</p>
            <ul className="list-disc list-inside space-y-2 text-sm">
              <li>
                <strong className="text-foreground">Página de Perfil:</strong> acesse{" "}
                <Link href="/perfil" className="text-primary hover:underline">
                  melhormetro.com.br/perfil
                </Link>{" "}
                para exportar ou excluir seus dados diretamente.
              </li>
              <li>
                <strong className="text-foreground">E-mail:</strong> envie sua solicitação para{" "}
                <a href="mailto:contato@melhormetro.com.br" className="text-primary hover:underline">
                  contato@melhormetro.com.br
                </a>{" "}
                com o assunto &ldquo;Exercício de Direitos LGPD&rdquo;.
              </li>
            </ul>
            <p className="mt-3 text-sm">
              Atenderemos sua solicitação dentro do prazo legal de 15 dias úteis. Podemos solicitar verificação de identidade antes de processar o pedido.
            </p>
          </section>

          {/* 11. Transferência internacional */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              11. Transferência Internacional de Dados
            </h2>
            <p>
              Alguns dos nossos fornecedores de tecnologia estão localizados fora do Brasil ou processam dados em servidores internacionais, incluindo:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm mt-3">
              <li><strong className="text-foreground">Cloudflare</strong> (EUA) — armazenamento de mídia</li>
              <li><strong className="text-foreground">Google LLC</strong> (EUA) — autenticação e analytics</li>
              <li><strong className="text-foreground">OpenAI</strong> (EUA) — processamento de IA</li>
            </ul>
            <p className="mt-3 text-sm">
              Essas transferências são realizadas com fornecedores que adotam padrões adequados de proteção de dados, em conformidade com o Art. 33 da LGPD e as diretrizes da ANPD.
            </p>
          </section>

          {/* 12. Alterações na política */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              12. Alterações nesta Política
            </h2>
            <p>
              Podemos atualizar esta Política de Privacidade periodicamente. Quando houver alterações relevantes, notificaremos você por e-mail ou por aviso destacado na plataforma com antecedência mínima de 10 dias. A data de vigência no topo deste documento sempre indicará a versão mais recente.
            </p>
            <p className="mt-3 text-sm">
              O uso continuado da plataforma após a notificação implica a aceitação da política atualizada.
            </p>
          </section>

          {/* 13. Contato */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              13. Contato e Encarregado de Dados (DPO)
            </h2>
            <div className="bg-card border border-border/50 rounded-lg p-4 text-sm space-y-2">
              <p><strong className="text-foreground">Plataforma:</strong> MelhorMetro</p>
              <p><strong className="text-foreground">Site:</strong>{" "}
                <a href="https://melhormetro.com.br" className="text-primary hover:underline">
                  melhormetro.com.br
                </a>
              </p>
              <p><strong className="text-foreground">E-mail de contato:</strong>{" "}
                <a href="mailto:contato@melhormetro.com.br" className="text-primary hover:underline">
                  contato@melhormetro.com.br
                </a>
              </p>
              <p><strong className="text-foreground">CNPJ:</strong> [a ser definido]</p>
              <p><strong className="text-foreground">Encarregado de Dados (DPO):</strong> [a ser definido]</p>
            </div>
          </section>

          {/* 14. Data de vigência */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              14. Data de Vigência
            </h2>
            <p>
              Esta Política de Privacidade entra em vigor em <strong className="text-foreground">29 de abril de 2026</strong> e substitui versões anteriores.
            </p>
          </section>

          <div className="border-t border-border/40 pt-6 text-xs text-muted-foreground/60">
            <p>
              MelhorMetro — Política de Privacidade conforme LGPD (Lei nº 13.709/2018).{" "}
              <Link href="/termos" className="hover:text-muted-foreground transition-colors underline">
                Ver Termos de Uso
              </Link>
            </p>
          </div>

        </div>
      </div>
    </main>
  );
}
