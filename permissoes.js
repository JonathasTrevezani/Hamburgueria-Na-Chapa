
// ==================== SISTEMA DE PERMISSÕES SIMPLIFICADO ====================
// Controla apenas visibilidade (frontend)

const nivelUsuario = localStorage.getItem('nivelUsuario') || 'funcionario';

console.log(`Sistema de permissões carregado para nível: ${nivelUsuario}`);

// Definir o que cada nível NÃO pode ver
const restricoes = {
    admin: {
        // Admin pode ver tudo
    },

    estoquista: {
        naoMostrarSidebar: [
            'novo-pedido',
            'pedidos',
            'financeiro',
            'cadastros',
            'relatorios',
            'historico'
        ],
        naoMostrarNav: ['Cadastro_Pessoal']
    },

    funcionario: {
        naoMostrarSidebar: [
            'estoque',
            'financeiro',
            'cadastros',
            'relatorios',
            'historico'
        ],
        naoMostrarNav: ['Cadastro_Pessoal']
    }
};

// Quando a página carregar
document.addEventListener('DOMContentLoaded', function () {
    console.log('Aplicando restrições visuais...');

    aplicarRestricoes(nivelUsuario);
    atualizarBadgeUsuario();

    console.log('Restrições aplicadas com sucesso!');
});

function aplicarRestricoes(nivel) {

    const restricao = restricoes[nivel] || restricoes.funcionario;

    // Admin não sofre restrições
    if (nivel === 'admin') {
        console.log('Admin: sem restrições aplicadas');
        return;
    }

    console.log(`Aplicando restrições para: ${nivel}`);

    // Ocultar sidebar
    if (restricao.naoMostrarSidebar) {
        restricao.naoMostrarSidebar.forEach(secaoId => {
            const link = document.querySelector(`.sidebar-link[href="#${secaoId}"]`);
            if (link) {
                link.style.display = 'none';
            }
        });
    }

    // Ocultar navbar
    if (restricao.naoMostrarNav) {
        restricao.naoMostrarNav.forEach(pagina => {

            document.querySelectorAll('.nav-link').forEach(link => {

                const onclick = link.getAttribute('onclick') || '';
                const href = link.getAttribute('href') || '';

                if (onclick.includes(`${pagina}.html`) || href.includes(`${pagina}.html`)) {
                    if (link.parentElement) {
                        link.parentElement.style.display = 'none';
                    }
                }
            });
        });
    }

    // Proteção extra
    setTimeout(() => {
        adicionarProtecaoLinks(nivel);
    }, 500);
}

function adicionarProtecaoLinks(nivel) {

    console.log('Adicionando proteção aos links...');

    if (nivel === 'estoquista') {
        protegerLinksNaoPermitidos(
            ['dashboard', 'estoque', 'cardapio', 'configuracoes'],
            nivel
        );
    }

    if (nivel === 'funcionario') {
        protegerLinksNaoPermitidos(
            ['dashboard', 'novo-pedido', 'pedidos', 'cardapio', 'configuracoes'],
            nivel
        );
    }
}

function protegerLinksNaoPermitidos(secoesPermitidas, nivel) {

    document.querySelectorAll('.sidebar-link').forEach(link => {

        const href = link.getAttribute('href');
        if (!href || !href.startsWith('#')) return;

        const secaoId = href.replace('#', '');

        if (!secoesPermitidas.includes(secaoId)) {

            link.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();

                alert(`⚠️ Acesso restrito!\n\nVocê não tem permissão para acessar esta seção.\n\nNível necessário: Administrador`);
            });

            link.style.opacity = '0.6';
            link.style.cursor = 'not-allowed';
        }
    });
}

function atualizarBadgeUsuario() {

    const badgeElement = document.getElementById('user-level');
    const userNameElement = document.getElementById('user-name');

    const nivelTraduzido = {
        admin: 'Administrador',
        estoquista: 'Estoquista',
        funcionario: 'Funcionário'
    }[nivelUsuario] || nivelUsuario;

    if (badgeElement) {

        badgeElement.textContent = nivelTraduzido;

        if (nivelUsuario === 'admin') {
            badgeElement.style.backgroundColor = '#dc3545';
            badgeElement.style.color = 'white';
        } else if (nivelUsuario === 'estoquista') {
            badgeElement.style.backgroundColor = '#0dcaf0';
            badgeElement.style.color = 'white';
        } else {
            badgeElement.style.backgroundColor = '#198754';
            badgeElement.style.color = 'white';
        }
    }

    if (userNameElement) {
        const nomeSalvo = localStorage.getItem('nomeUsuario');
        if (nomeSalvo && nomeSalvo !== 'Usuário') {
            userNameElement.textContent = nomeSalvo;
        }
    }
}

function temPermissao(secaoId) {

    if (nivelUsuario === 'admin') return true;

    if (nivelUsuario === 'estoquista') {
        return ['dashboard', 'estoque', 'cardapio', 'configuracoes'].includes(secaoId);
    }

    if (nivelUsuario === 'funcionario') {
        return ['dashboard', 'novo-pedido', 'pedidos', 'cardapio', 'configuracoes'].includes(secaoId);
    }

    return false;
}

// Export global seguro
window.nivelUsuario = nivelUsuario;
window.temPermissao = temPermissao;

console.log('✅ Sistema de permissões pronto!');