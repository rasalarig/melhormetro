import Link from "next/link";

export const metadata = {
  title: "Termos de Uso | MelhorMetro",
  description: "Termos e condições de uso da plataforma MelhorMetro",
};

export default function TermosPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Termos de Uso
          </h1>
          <p className="text-sm text-muted-foreground">
            Vigência: 29 de abril de 2026
          </p>
        </div>

        <div className="space-y-10 text-muted-foreground leading-relaxed">

          {/* 1. Aceitação dos termos */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              1. Aceitação dos Termos
            </h2>
            <p>
              Ao acessar ou utilizar a plataforma <strong className="text-foreground">MelhorMetro</strong>, disponível em{" "}
              <a href="https://melhormetro.com.br" className="text-primary hover:underline">
                melhormetro.com.br
              </a>
              , você declara ter lido, compreendido e concordado integralmente com estes Termos de Uso e com nossa{" "}
              <Link href="/privacidade" className="text-primary hover:underline">
                Política de Privacidade
              </Link>
              .
            </p>
            <p className="mt-3">
              Se você não concorda com qualquer disposição destes Termos, não utilize a plataforma. O uso continuado após alterações implica aceitação dos termos atualizados.
            </p>
          </section>

          {/* 2. Descrição do serviço */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              2. Descrição do Serviço
            </h2>
            <p className="mb-3">
              A MelhorMetro é um marketplace imobiliário digital que oferece:
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm">
              <li><strong className="text-foreground">Busca de imóveis:</strong> mecanismo de busca com filtros avançados e busca por inteligência artificial.</li>
              <li><strong className="text-foreground">Anúncios:</strong> publicação de imóveis para venda ou locação por proprietários e profissionais.</li>
              <li><strong className="text-foreground">Tours virtuais e reels:</strong> exibição de conteúdo em vídeo dos imóveis anunciados.</li>
              <li><strong className="text-foreground">Mensagens:</strong> sistema de comunicação interno entre compradores/locatários e anunciantes.</li>
              <li><strong className="text-foreground">Intermediação:</strong> serviço opcional pelo qual a plataforma atua como intermediária na condução da negociação.</li>
              <li><strong className="text-foreground">Ferramentas para profissionais:</strong> recursos dedicados a autônomos e imobiliárias, incluindo gestão de carteira e relatórios.</li>
            </ul>
            <p className="mt-3 text-sm">
              A MelhorMetro é uma plataforma tecnológica, não uma imobiliária credenciada para representar partes em transações. A responsabilidade final pelas negociações é das partes envolvidas.
            </p>
          </section>

          {/* 3. Cadastro e conta */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              3. Cadastro e Conta
            </h2>
            <ul className="list-disc list-inside space-y-2 text-sm">
              <li>É permitida <strong className="text-foreground">uma conta por pessoa</strong>. Contas duplicadas podem ser suspensas.</li>
              <li>Você é responsável por fornecer informações <strong className="text-foreground">verdadeiras, precisas e atualizadas</strong> no cadastro.</li>
              <li>Você é responsável pela confidencialidade da sua senha e por todas as atividades realizadas em sua conta.</li>
              <li>Em caso de uso não autorizado da conta, você deve nos notificar imediatamente em{" "}
                <a href="mailto:contato@melhormetro.com.br" className="text-primary hover:underline">
                  contato@melhormetro.com.br
                </a>
                .
              </li>
              <li>Profissionais (autônomos e imobiliárias) devem informar seu número de CRECI válido. A MelhorMetro pode verificar e recusar registros inválidos.</li>
              <li>É proibido criar contas usando identidade de terceiros ou informações falsas.</li>
            </ul>
          </section>

          {/* 4. Regras de uso */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              4. Regras de Uso — Condutas Proibidas
            </h2>
            <p className="mb-3">São expressamente proibidas as seguintes condutas:</p>
            <ul className="list-disc list-inside space-y-2 text-sm">
              <li>Publicar <strong className="text-foreground">anúncios falsos, enganosos ou duplicados</strong> de imóveis.</li>
              <li>Compartilhar <strong className="text-foreground">dados de contato externos</strong> (telefone, WhatsApp, e-mail, redes sociais) pelo sistema de mensagens interno da plataforma.</li>
              <li>Utilizar a plataforma para envio de <strong className="text-foreground">spam ou mensagens em massa</strong> não solicitadas.</li>
              <li>Assediar, ameaçar, discriminar ou agir de forma abusiva com outros usuários.</li>
              <li>Tentar acessar contas de outros usuários ou sistemas internos sem autorização.</li>
              <li>Utilizar bots, scrapers ou qualquer automação para acessar ou extrair dados da plataforma sem autorização prévia.</li>
              <li>Publicar conteúdo ilegal, ofensivo, pornográfico ou que viole direitos de terceiros.</li>
              <li>Burlar mecanismos de segurança, pagamento ou de intermediação da plataforma.</li>
              <li>Anunciar imóveis sobre os quais você não tem autorização para negociar.</li>
            </ul>
            <p className="mt-3 text-sm">
              O descumprimento dessas regras pode resultar em suspensão ou exclusão permanente da conta, sem aviso prévio.
            </p>
          </section>

          {/* 5. Conteúdo do usuário */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              5. Conteúdo do Usuário
            </h2>
            <p className="mb-3">
              Você é o <strong className="text-foreground">proprietário do conteúdo</strong> que publica na plataforma (fotos, vídeos, textos de anúncios, mensagens).
            </p>
            <p className="mb-3">
              Ao publicar conteúdo na MelhorMetro, você nos concede uma <strong className="text-foreground">licença não exclusiva, gratuita e mundial</strong> para reproduzir, adaptar, exibir e distribuir esse conteúdo nos ambientes da plataforma (site, aplicativo, redes sociais da MelhorMetro) enquanto o anúncio estiver ativo.
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm">
              <li>Você declara ter todos os direitos necessários sobre o conteúdo publicado.</li>
              <li>É proibido publicar conteúdo que viole direitos autorais, marcas registradas ou direitos de privacidade de terceiros.</li>
              <li>A MelhorMetro se reserva o direito de remover conteúdo que viole estes Termos ou que seja considerado inadequado.</li>
              <li>Fotos e vídeos publicados são armazenados em infraestrutura de nuvem segura e podem ser excluídos pelo usuário a qualquer momento.</li>
            </ul>
          </section>

          {/* 6. Imóveis e anúncios */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              6. Imóveis e Anúncios
            </h2>
            <ul className="list-disc list-inside space-y-2 text-sm">
              <li>O anunciante é <strong className="text-foreground">inteiramente responsável</strong> pela veracidade, precisão e legalidade das informações publicadas no anúncio.</li>
              <li>Anúncios podem passar por <strong className="text-foreground">processo de aprovação</strong> antes de serem exibidos publicamente.</li>
              <li>A MelhorMetro pode remover, suspender ou solicitar correção de anúncios que violem estes Termos, contenham informações incorretas ou estejam em desacordo com a realidade do imóvel.</li>
              <li>A disponibilidade do imóvel deve ser mantida atualizada pelo anunciante. Anúncios de imóveis já vendidos ou alugados devem ser encerrados imediatamente.</li>
              <li>Anúncios inativos por período prolongado podem ser removidos automaticamente.</li>
            </ul>
          </section>

          {/* 7. Intermediação */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              7. Intermediação
            </h2>
            <p className="mb-3">
              A MelhorMetro oferece um serviço opcional de <strong className="text-foreground">intermediação de negociações imobiliárias</strong>, pelo qual a plataforma auxilia na condução e formalização do acordo entre as partes.
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm">
              <li>A intermediação é voluntária e deve ser ativada pelas partes envolvidas na negociação.</li>
              <li>Quando a intermediação resultar em negócio concluído, <strong className="text-foreground">uma comissão será cobrada</strong> conforme a tabela de preços vigente na plataforma no momento da contratação.</li>
              <li>Os termos específicos da intermediação (comissão, prazo, condições) serão apresentados e devem ser aceitos pelas partes antes do início do processo.</li>
              <li>A MelhorMetro, ao atuar como intermediária, não se torna parte da transação imobiliária, não garantindo a conclusão do negócio.</li>
              <li>Em caso de desistência após o início formal da intermediação, podem incidir taxas administrativas conforme os termos do serviço de intermediação.</li>
            </ul>
          </section>

          {/* 8. Comunicação na plataforma */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              8. Comunicação na Plataforma
            </h2>
            <p className="mb-3">
              O sistema de mensagens interno da MelhorMetro é o canal oficial de comunicação entre usuários dentro da plataforma.
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm">
              <li>As mensagens podem ser <strong className="text-foreground">monitoradas automaticamente</strong> para garantir conformidade com estes Termos, especialmente para prevenir o compartilhamento de dados de contato externos.</li>
              <li>O compartilhamento de telefone, WhatsApp, e-mail, Instagram ou qualquer outro dado de contato externo pelo chat é <strong className="text-foreground">bloqueado pela plataforma</strong> e constitui violação destes Termos.</li>
              <li>O conteúdo das mensagens pode ser acessado pela equipe da MelhorMetro em caso de denúncia, investigação de fraude ou determinação judicial.</li>
              <li>É proibido usar o sistema de mensagens para fins comerciais não relacionados ao imóvel anunciado, spam ou qualquer conduta vedada na Seção 4.</li>
            </ul>
          </section>

          {/* 9. Pagamentos e comissões */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              9. Pagamentos e Comissões
            </h2>
            <ul className="list-disc list-inside space-y-2 text-sm">
              <li>A <strong className="text-foreground">taxa de comissão</strong> aplicável à intermediação é informada na plataforma no momento da contratação do serviço.</li>
              <li>O pagamento da comissão é condicionado à conclusão efetiva do negócio intermediado.</li>
              <li>Planos pagos (ex.: Premium) têm seus valores, condições e renovações descritos na página de assinatura.</li>
              <li>Reembolsos seguem a política específica de cada produto/serviço contratado, conforme o Código de Defesa do Consumidor (Lei nº 8.078/1990).</li>
              <li>A MelhorMetro utiliza processadores de pagamento terceirizados. Não armazenamos dados de cartão de crédito.</li>
            </ul>
          </section>

          {/* 10. Propriedade intelectual */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              10. Propriedade Intelectual
            </h2>
            <p className="mb-3">
              Todo o conteúdo de titularidade da MelhorMetro é protegido por direitos de propriedade intelectual:
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm">
              <li><strong className="text-foreground">Marca MelhorMetro:</strong> nome, logotipo e identidade visual são propriedade exclusiva da plataforma.</li>
              <li><strong className="text-foreground">Código e tecnologia:</strong> o código-fonte, algoritmos, modelos de IA e banco de dados da plataforma são de propriedade exclusiva da MelhorMetro.</li>
              <li><strong className="text-foreground">Funcionalidades de IA:</strong> os recursos de busca inteligente e recomendações personalizadas são desenvolvidos e protegidos pela MelhorMetro.</li>
              <li>É proibido copiar, reproduzir, distribuir ou criar obras derivadas a partir de qualquer conteúdo de propriedade da MelhorMetro sem autorização prévia e por escrito.</li>
            </ul>
          </section>

          {/* 11. Limitação de responsabilidade */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              11. Limitação de Responsabilidade
            </h2>
            <p className="mb-3">
              A MelhorMetro é uma plataforma tecnológica que conecta partes interessadas em negociações imobiliárias. Portanto:
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm">
              <li>A MelhorMetro <strong className="text-foreground">não é parte nas negociações</strong> entre compradores e vendedores/locadores, exceto quando atuar expressamente como intermediária.</li>
              <li>Não nos responsabilizamos pela <strong className="text-foreground">veracidade das informações</strong> inseridas pelos usuários nos anúncios.</li>
              <li>Não garantimos a conclusão de qualquer negociação iniciada pela plataforma.</li>
              <li>Não nos responsabilizamos por danos decorrentes de negociações realizadas fora da plataforma ou que burlem o sistema de intermediação.</li>
              <li>A plataforma pode sofrer interrupções técnicas. Não garantimos disponibilidade contínua e ininterrupta do serviço.</li>
              <li>Nossa responsabilidade, quando aplicável, é limitada ao valor pago pelo usuário à plataforma nos últimos 12 meses.</li>
            </ul>
          </section>

          {/* 12. Suspensão e cancelamento */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              12. Suspensão e Cancelamento de Conta
            </h2>
            <div className="space-y-3 text-sm">
              <div>
                <h3 className="font-semibold text-foreground mb-1">Pela MelhorMetro:</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>Podemos suspender ou encerrar contas que violem estes Termos, sem aviso prévio em casos graves.</li>
                  <li>Em casos menos graves, poderemos notificar e dar prazo para adequação antes da suspensão.</li>
                  <li>Contas com atividade suspeita ou fraudulenta podem ser bloqueadas imediatamente.</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Pelo Usuário:</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>Você pode solicitar a exclusão da sua conta a qualquer momento pela{" "}
                    <Link href="/perfil" className="text-primary hover:underline">
                      página de Perfil
                    </Link>{" "}
                    ou por e-mail.
                  </li>
                  <li>A exclusão encerra o acesso à conta e inicia o processo de exclusão dos seus dados pessoais, conforme nossa Política de Privacidade.</li>
                  <li>Intermediações em andamento e obrigações financeiras pendentes não são canceladas automaticamente pela exclusão da conta.</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 13. Modificações */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              13. Modificações dos Termos
            </h2>
            <p>
              A MelhorMetro se reserva o direito de modificar estes Termos de Uso a qualquer tempo. Alterações relevantes serão comunicadas com antecedência mínima de 10 dias via e-mail ou aviso destacado na plataforma.
            </p>
            <p className="mt-3">
              O uso continuado da plataforma após a comunicação das alterações implica a aceitação dos novos termos. Caso discorde das modificações, você deve encerrar sua conta antes da entrada em vigor dos novos termos.
            </p>
          </section>

          {/* 14. Lei aplicável */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              14. Lei Aplicável e Foro
            </h2>
            <p>
              Estes Termos de Uso são regidos pelas <strong className="text-foreground">leis da República Federativa do Brasil</strong>, incluindo, mas não se limitando ao Código Civil, ao Código de Defesa do Consumidor (Lei nº 8.078/1990) e à LGPD (Lei nº 13.709/2018).
            </p>
            <p className="mt-3">
              Eventuais conflitos decorrentes destes Termos serão submetidos ao foro da comarca onde a MelhorMetro estiver domiciliada, com renúncia a qualquer outro, por mais privilegiado que seja.
            </p>
          </section>

          {/* 15. Contato */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              15. Contato
            </h2>
            <p className="mb-3">
              Para dúvidas, sugestões ou reclamações relacionadas a estes Termos de Uso:
            </p>
            <div className="bg-card border border-border/50 rounded-lg p-4 text-sm space-y-2">
              <p><strong className="text-foreground">Plataforma:</strong> MelhorMetro</p>
              <p><strong className="text-foreground">Site:</strong>{" "}
                <a href="https://melhormetro.com.br" className="text-primary hover:underline">
                  melhormetro.com.br
                </a>
              </p>
              <p><strong className="text-foreground">E-mail:</strong>{" "}
                <a href="mailto:contato@melhormetro.com.br" className="text-primary hover:underline">
                  contato@melhormetro.com.br
                </a>
              </p>
              <p><strong className="text-foreground">CNPJ:</strong> [a ser definido]</p>
            </div>
          </section>

          <div className="border-t border-border/40 pt-6 text-xs text-muted-foreground/60">
            <p>
              MelhorMetro — Termos de Uso. Vigência: 29 de abril de 2026.{" "}
              <Link href="/privacidade" className="hover:text-muted-foreground transition-colors underline">
                Ver Política de Privacidade
              </Link>
            </p>
          </div>

        </div>
      </div>
    </main>
  );
}
