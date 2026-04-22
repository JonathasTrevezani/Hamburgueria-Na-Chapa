// Leitor.js — Sistema Completo de Gerenciamento de Lanchonete
// Integrado com MySQL via API PHP

// ==================== SOLUÇÃO SIMPLES ====================
// Função para fechar todos os modais quando a página carrega
window.onload = function () {
    setTimeout(function () {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
        console.log("Todos os modais fechados automaticamente");
    }, 100);
};

// ==================== CONFIGURAÇÃO DO API ====================
const API_URL = "api.php"; // Use caminho relativo, não absoluto

async function apiGet(params) {
    try {
        const url = params.includes('http') ? params : `${API_URL}?${params}`;
        console.log(`📡 API Request: ${url}`);

        const response = await fetch(url, {
            credentials: 'same-origin',
            headers: {
                'Accept': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });

        if (!response.ok) {
            console.error(`❌ Erro HTTP ${response.status}: ${response.statusText}`);
            return [];
        }

        const data = await response.json();
        console.log(`✅ API Response:`, typeof data, data);

        // Verificar se é um array
        if (Array.isArray(data)) {
            return data;
        }
        // Verificar se tem propriedade de erro
        else if (data && data.error) {
            console.error(`⚠️ Erro na resposta: ${data.error}`);
            return [];
        }
        // Verificar se tem success false
        else if (data && data.success === false) {
            console.error(`⚠️ Operação falhou: ${data.message || 'Sem mensagem'}`);
            return [];
        }
        // Se for um objeto vazio ou com outra estrutura
        else if (data && typeof data === 'object') {
            console.log(`🔄 Objeto recebido, convertendo para array`);
            // Se for um objeto com propriedades, colocá-lo em um array
            if (Object.keys(data).length > 0) {
                return [data];
            } else {
                return [];
            }
        }
        // Se for null, undefined, string, number, boolean
        else if (data === null || data === undefined) {
            console.warn(`📭 Resposta vazia (null/undefined)`);
            return [];
        }
        else {
            console.warn(`❓ Tipo de resposta inesperado:`, typeof data, data);
            return [];
        }

    } catch (err) {
        console.error(`💥 Erro na requisição GET:`, err);
        return [];
    }
}

async function apiPost(params, body) {
    try {
        const url = `${API_URL}?${params}`;
        console.log(`📨 API POST Request: ${url}`, body);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            credentials: 'same-origin',
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log(`✅ API POST Response:`, data);
        return data;

    } catch (err) {
        console.error(`💥 Erro na requisição POST:`, err);
        return { success: false, message: 'Erro ao conectar com o servidor' };
    }
}

// ==================== VERIFICAÇÃO DE PÁGINA ====================
function isPaginaNovoPedido() {
    return document.getElementById("novo-pedido") !== null ||
        document.getElementById("pedido-observacao") !== null;
}

function isPaginaRelatorios() {
    return document.getElementById("relatorios") !== null ||
        document.getElementById("relatorio-data-rel") !== null;
}

// ==================== SISTEMA DE ACESSIBILIDADE - LEITOR DE VOZ ====================
let voiceActive = false;
let isReading = false;
let speechSynthesis = window.speechSynthesis;
let currentUtterance = null;
let lastSpeakTime = 0;

function speakText(text) {
    if (!voiceActive) return;
    if (isReading) speechSynthesis.cancel();

    currentUtterance = new SpeechSynthesisUtterance(text);
    currentUtterance.lang = 'pt-BR';
    currentUtterance.rate = 1.0;
    currentUtterance.pitch = 1.0;
    isReading = true;

    currentUtterance.onend = function () {
        isReading = false;
    };

    speechSynthesis.speak(currentUtterance);
}

function stopSpeaking() {
    speechSynthesis.cancel();
    isReading = false;
}

document.addEventListener('DOMContentLoaded', function () {
    const voiceToggle = document.getElementById('voiceToggle');
    if (voiceToggle) {
        voiceToggle.addEventListener('click', () => {
            voiceActive = !voiceActive;
            if (voiceActive) {
                alert("Leitor de voz ativado! Passe o mouse sobre o texto para ouvir.");
            } else {
                stopSpeaking();
                alert("Leitor de voz desativado.");
            }
        });
    }

    // Sistema de leitura ao passar o mouse
    document.addEventListener('mouseover', function (event) {
        const element = event.target;
        if (!element || !event.relatedTarget) return;
        if (window.getComputedStyle(element).display === 'none' || window.getComputedStyle(element).visibility === 'hidden') return;
        if (element.tagName.toLowerCase() === 'script' || element.tagName.toLowerCase() === 'style') return;

        const rect = element.getBoundingClientRect();
        const mouseX = event.clientX;
        const mouseY = event.clientY;
        if (mouseX < rect.left || mouseX > rect.right || mouseY < rect.top || mouseY > rect.bottom) return;

        let text = '';
        if (element.id === 'voiceToggle' || element.closest?.('#voiceToggle')) {
            text = 'Leitor de voz';
        } else {
            text = element.textContent?.trim() || '';
            if (text.length < 1) return;
        }

        const now = Date.now();
        if (now - lastSpeakTime < 1000) return;

        if (voiceActive) {
            speakText(text);
            lastSpeakTime = now;
        }
    });
});

// ==================== SISTEMA DE NAVEGAÇÃO ====================
function mostrarPagina(paginaId) {
    // FECHA TODOS OS MODAIS PRIMEIRO
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });

    document.querySelectorAll('.content-section').forEach(sec => {
        sec.style.display = 'none';
    });

    const pagina = document.getElementById(paginaId);
    if (pagina) {
        pagina.style.display = 'block';
    }

    // Atualizar interfaces específicas
    if (paginaId === 'estoque') {
        atualizarInterfaceEstoque();
    } else if (paginaId === 'cardapio') {
        atualizarInterfaceCardapio();
    } else if (paginaId === 'novo-pedido') {
        atualizarSelectCardapio();
        preencherDataPedido();
        preencherHorarioPedido();
    } else if (paginaId === 'pedidos') {
        carregarPedidos();
    } else if (paginaId === 'historico') {
        resetarAbasSecao('historico');
    } else if (paginaId === 'configuracoes') {
        resetarAbasSecao('configuracoes');
        // Inicializar configurações quando a página for aberta
        setTimeout(() => {
            inicializarConfiguracoes();
            carregarConfiguracoesSalvas();
        }, 100);
    }
}

document.querySelectorAll('.nav-link, .sidebar-link').forEach(link => {
    link.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href').substring(1);

        document.querySelectorAll('.nav-link, .sidebar-link').forEach(l => {
            l.classList.remove('active');
        });
        this.classList.add('active');

        mostrarPagina(targetId);
    });
});

// ==================== SISTEMA DE ESTOQUE ====================
let estoque = [];
let estoqueCarregado = false;

async function carregarEstoqueDoBackend() {
    try {
        const data = await apiGet('module=estoque&action=listar');
        if (Array.isArray(data)) {
            estoque = data.map(item => ({
                id: Number(item.id),
                item: item.item,
                quantidade: Number(item.quantidade),
                minimo: Number(item.minimo),
                maximo: Number(item.maximo),
                unidade: item.unidade,
                status: item.status || calcularStatus({
                    quantidade: Number(item.quantidade),
                    minimo: Number(item.minimo),
                    maximo: Number(item.maximo)
                })
            }));
        } else {
            console.error('Resposta listar estoque inesperada:', data);
            estoque = [];
        }
        estoqueCarregado = true;
        atualizarInterfaceEstoque();

        // VERIFICAR DISPONIBILIDADE DO CARDÁPIO APÓS CARREGAR ESTOQUE
        if (cardapio.length > 0) {
            verificarDisponibilidadeCardapio();
        }
    } catch (err) {
        console.error('Erro ao carregar estoque do backend:', err);
    }
}

function calcularStatus(item) {
    const percentual = (item.quantidade / item.maximo) * 100;
    if (item.quantidade <= item.minimo) return "critico";
    else if (percentual >= 90) return "maximo";
    else if (item.quantidade <= item.minimo * 1.5) return "alerta";
    else return "ok";
}

function atualizarEstatisticas() {
    const totalItens = estoque.length;
    const itensCriticos = estoque.filter(item => item.status === "critico").length;
    const itensOk = estoque.filter(item => item.status === "ok").length;
    const itensMaximo = estoque.filter(item => item.status === "maximo").length;

    const elementos = {
        'total-itens': totalItens,
        'itens-criticos': itensCriticos,
        'itens-ok': itensOk,
        'itens-maximo': itensMaximo,
        'contador-criticos': itensCriticos,
        'contador-maximo': itensMaximo,
        'alert-estoque-baixo': itensCriticos
    };

    Object.entries(elementos).forEach(([id, valor]) => {
        const el = document.getElementById(id);
        if (el) el.textContent = valor;
    });

    const alertCrit = document.getElementById('alert-critico-estoque');
    const alertMax = document.getElementById('alert-maximo-estoque');
    if (alertCrit) alertCrit.style.display = itensCriticos > 0 ? 'flex' : 'none';
    if (alertMax) alertMax.style.display = itensMaximo > 0 ? 'flex' : 'none';
}

function renderizarTabela() {
    const corpoTabela = document.getElementById('corpo-tabela');
    if (!corpoTabela) return;
    corpoTabela.innerHTML = '';

    estoque.forEach(item => {
        const percentual = (item.quantidade / item.maximo) * 100;
        let classeProgresso = '', textoStatus = '', badgeClass = '';

        if (item.status === "critico") {
            classeProgresso = 'progress-danger';
            textoStatus = 'CRÍTICO';
            badgeClass = 'badge-danger';
        } else if (item.status === "maximo") {
            classeProgresso = 'progress-info';
            textoStatus = 'MÁXIMO';
            badgeClass = 'badge-info';
        } else if (item.status === "alerta") {
            classeProgresso = 'progress-warning';
            textoStatus = 'ALERTA';
            badgeClass = 'badge-warning';
        } else {
            classeProgresso = 'progress-success';
            textoStatus = 'OK';
            badgeClass = 'badge-success';
        }

        const linha = `
            <tr>
                <td><strong>${item.item}</strong></td>
                <td>${item.quantidade} ${item.unidade}</td>
                <td>${item.minimo} ${item.unidade}</td>
                <td>${item.maximo} ${item.unidade}</td>
                <td><span class="badge ${badgeClass}">${textoStatus}</span></td>
                <td>
                    <div class="progress-container">
                        <div class="progress-bar ${classeProgresso}" 
                             style="width: ${Math.min(percentual, 100)}%">
                        </div>
                    </div>
                    <small>${Math.round(percentual)}%</small>
                </td>
                <td>
                    <div class="btn-group" style="gap: 10px;">
                        <button class="btn btn-primary" onclick="editarItem(${item.id})">Editar</button>
                        <button class="btn btn-success" onclick="ajustarEstoque(${item.id}, 10)">+10</button>
                        <button class="btn btn-warning" onclick="ajustarEstoque(${item.id}, -5)">-5</button>
                        <button class="btn btn-danger" onclick="removerItemEstoque(${item.id})">🗑️</button>
                    </div>
                </td>
            </tr>
        `;
        corpoTabela.innerHTML += linha;
    });
}

function renderizarItensCriticos() {
    const listaCriticos = document.getElementById('lista-criticos');
    if (!listaCriticos) return;
    const itensCriticos = estoque.filter(item => item.status === "critico");
    listaCriticos.innerHTML = '';

    if (itensCriticos.length > 0) {
        document.getElementById('card-criticos').style.display = 'block';
        itensCriticos.forEach(item => {
            listaCriticos.innerHTML += `
                <div class="alert alert-danger">
                    <strong>${item.item}</strong><br>
                    <small>${item.quantidade} ${item.unidade} disponíveis (mínimo: ${item.minimo} ${item.unidade})</small>
                    <button class="btn btn-primary" style="float: right;" onclick="ajustarEstoque(${item.id}, 50)">
                        Repor +50
                    </button>
                </div>
            `;
        });
    } else {
        document.getElementById('card-criticos').style.display = 'none';
    }
}

function renderizarItensMaximo() {
    const listaMaximo = document.getElementById('lista-maximo');
    if (!listaMaximo) return;
    const itensMaximo = estoque.filter(item => item.status === "maximo");
    listaMaximo.innerHTML = '';

    if (itensMaximo.length > 0) {
        document.getElementById('card-maximo').style.display = 'block';
        itensMaximo.forEach(item => {
            listaMaximo.innerHTML += `
                <div class="alert alert-info">
                    <strong>${item.item}</strong><br>
                    <small>${item.quantidade} ${item.unidade} de ${item.maximo} ${item.unidade} máximo</small>
                    <button class="btn btn-warning" style="float: right;" onclick="ajustarEstoque(${item.id}, -10)">
                        Reduzir -10
                    </button>
                </div>
            `;
        });
    } else {
        document.getElementById('card-maximo').style.display = 'none';
    }
}

let editandoItemId = null;

function mostrarFormulario() {
    const formContainer = document.getElementById('form-container');
    if (formContainer) formContainer.style.display = 'block';
    document.getElementById('form-titulo').textContent = '➕ Adicionar Novo Item ao Estoque';
    document.getElementById('btn-adicionar').textContent = 'Adicionar Item';
    document.getElementById('btn-cancelar').style.display = 'none';
    editandoItemId = null;

    document.getElementById('item-nome').value = '';
    document.getElementById('item-quantidade').value = '0';
    document.getElementById('item-minimo').value = '10';
    document.getElementById('item-maximo').value = '100';
    document.getElementById('item-unidade').value = 'unidades';
}

async function adicionarItem() {
    const nome = document.getElementById('item-nome').value;
    const quantidade = parseInt(document.getElementById('item-quantidade').value);
    const minimo = parseInt(document.getElementById('item-minimo').value);
    const maximo = parseInt(document.getElementById('item-maximo').value);
    const unidade = document.getElementById('item-unidade').value;

    if (!nome || quantidade < 0 || minimo < 1 || maximo < minimo) {
        alert('Por favor, preencha todos os campos corretamente!');
        return;
    }

    const payload = { item: nome, quantidade, minimo, maximo, unidade };

    if (editandoItemId) {
        payload.id = editandoItemId;
        try {
            const resp = await apiPost('module=estoque&action=atualizar', payload);
            if (resp.success) {
                const itemLocal = estoque.find(i => Number(i.id) === Number(editandoItemId));
                if (itemLocal) {
                    itemLocal.item = nome;
                    itemLocal.quantidade = quantidade;
                    itemLocal.minimo = minimo;
                    itemLocal.maximo = maximo;
                    itemLocal.unidade = unidade;
                    itemLocal.status = calcularStatus(itemLocal);
                }
                mostrarFormulario();
                atualizarInterfaceEstoque();
                alert('Item atualizado com sucesso!');
            } else {
                alert(resp.message || 'Erro ao atualizar item');
            }
        } catch (err) {
            console.error(err);
            alert('Erro ao atualizar item');
        }
    } else {
        try {
            const resp = await apiPost('module=estoque&action=adicionar', payload);
            if (resp.success && resp.id) {
                const novoItem = {
                    id: Number(resp.id),
                    item: nome,
                    quantidade,
                    minimo,
                    maximo,
                    unidade,
                    status: calcularStatus({ quantidade, minimo, maximo })
                };
                estoque.push(novoItem);
                atualizarInterfaceEstoque();
                mostrarFormulario();
                alert('Item adicionado com sucesso!');
            } else {
                alert(resp.message || 'Erro ao adicionar item');
            }
        } catch (err) {
            console.error(err);
            alert('Erro ao adicionar item');
        }
    }
}

function editarItem(id) {
    const item = estoque.find(i => Number(i.id) === Number(id));
    if (item) {
        editandoItemId = id;
        const formContainer = document.getElementById('form-container');
        if (formContainer) formContainer.style.display = 'block';
        document.getElementById('form-titulo').textContent = '✏️ Editar Item';
        document.getElementById('btn-adicionar').textContent = 'Atualizar Item';
        document.getElementById('btn-cancelar').style.display = 'inline-block';

        document.getElementById('item-nome').value = item.item;
        document.getElementById('item-quantidade').value = item.quantidade;
        document.getElementById('item-minimo').value = item.minimo;
        document.getElementById('item-maximo').value = item.maximo;
        document.getElementById('item-unidade').value = item.unidade;
        
        // ADICIONA A ROLAGEM SUAVE ATÉ O FORMULÁRIO
        if (formContainer) {
            formContainer.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start',
                inline: 'nearest'
            });
        }
    }
}

function cancelarEdicao() {
    const formContainer = document.getElementById('form-container');
    if (formContainer) {
        // NÃO FECHA O FORMULÁRIO, APENAS RESETA PARA O MODO ADICIONAR
        editandoItemId = null;
        
        // LIMPA OS CAMPOS DO FORMULÁRIO
        document.getElementById('item-nome').value = '';
        document.getElementById('item-quantidade').value = '0';
        document.getElementById('item-minimo').value = '10';
        document.getElementById('item-maximo').value = '100';
        document.getElementById('item-unidade').value = 'unidades';
        
        // RESETA O TÍTULO E BOTÕES PARA O MODO "ADICIONAR"
        document.getElementById('form-titulo').textContent = '➕ Adicionar Novo Item ao Estoque';
        document.getElementById('btn-adicionar').textContent = 'Adicionar Item';
        document.getElementById('btn-cancelar').style.display = 'none';
        
        // ROLA A TELA SUAVEMENTE ATÉ O FORMULÁRIO
        formContainer.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start',
            inline: 'nearest'
        });
        
        // DESTACA O FORMULÁRIO COM UM EFEITO VISUAL
        const originalBoxShadow = formContainer.style.boxShadow;
        formContainer.style.transition = 'box-shadow 0.3s ease';
        formContainer.style.boxShadow = '0 0 0 3px rgba(40,167,69,0.5)';
        setTimeout(() => {
            if (formContainer) formContainer.style.boxShadow = originalBoxShadow;
        }, 1000);
    }
}

async function ajustarEstoque(id, quantidade) {
    const item = estoque.find(i => Number(i.id) === Number(id));
    if (!item) return;

    // ENCONTRA O BOTÃO CLICADO
    const botoes = document.querySelectorAll(`button[onclick*="ajustarEstoque(${id}, ${quantidade})"]`);
    const botaoClicado = Array.from(botoes).find(btn => btn.textContent.includes(quantidade > 0 ? `+${quantidade}` : `${quantidade}`));
    
    if (botaoClicado) {
        // SALVA O TEXTO ORIGINAL
        const textoOriginal = botaoClicado.innerHTML;
        botaoClicado._textoOriginal = textoOriginal;
        
        // MUDA O TEXTO PARA INDICAR CARREGAMENTO
        botaoClicado.innerHTML = `⏳ ${quantidade > 0 ? '+' : ''}${Math.abs(quantidade)}`;
        botaoClicado.disabled = true;
        
        // EFEITO VISUAL DE CLIQUE (muda a cor temporariamente)
        const corOriginal = botaoClicado.style.backgroundColor;
        botaoClicado.style.backgroundColor = quantidade > 0 ? '#1e7e34' : '#d39e00';
        setTimeout(() => {
            if (botaoClicado) botaoClicado.style.backgroundColor = corOriginal;
        }, 150);
    }

    const novaQuantidade = item.quantidade + quantidade;
    if (novaQuantidade < 0) {
        alert('Quantidade não pode ser negativa!');
        if (botaoClicado) {
            botaoClicado.innerHTML = botaoClicado._textoOriginal;
            botaoClicado.disabled = false;
        }
        return;
    }
    if (novaQuantidade > item.maximo) {
        alert(`Quantidade não pode ultrapassar o máximo de ${item.maximo} ${item.unidade}!`);
        if (botaoClicado) {
            botaoClicado.innerHTML = botaoClicado._textoOriginal;
            botaoClicado.disabled = false;
        }
        return;
    }

    try {
        const resp = await apiPost('module=estoque&action=ajustar', { id, quantidade });
        if (resp.success) {
            // FEEDBACK DE SUCESSO - MUDA A COR DO BOTÃO PARA VERDE
            if (botaoClicado) {
                const corOriginal = botaoClicado.style.backgroundColor;
                botaoClicado.style.backgroundColor = '#28a745';
                setTimeout(() => {
                    if (botaoClicado) botaoClicado.style.backgroundColor = corOriginal;
                }, 300);
            }
            
            await carregarEstoqueDoBackend();
            
            // VERIFICAR DISPONIBILIDADE DO CARDÁPIO APÓS AJUSTAR ESTOQUE
            if (cardapio.length > 0) {
                verificarDisponibilidadeCardapio();
            }
        } else {
            // FEEDBACK DE ERRO - MUDA A COR DO BOTÃO PARA VERMELHO
            if (botaoClicado) {
                const corOriginal = botaoClicado.style.backgroundColor;
                botaoClicado.style.backgroundColor = '#dc3545';
                setTimeout(() => {
                    if (botaoClicado) botaoClicado.style.backgroundColor = corOriginal;
                }, 500);
            }
            alert(resp.message || 'Erro ao ajustar estoque');
        }
    } catch (err) {
        console.error(err);
        if (botaoClicado) {
            const corOriginal = botaoClicado.style.backgroundColor;
            botaoClicado.style.backgroundColor = '#dc3545';
            setTimeout(() => {
                if (botaoClicado) botaoClicado.style.backgroundColor = corOriginal;
            }, 500);
        }
        alert('Erro ao ajustar estoque');
    } finally {
        // RESTAURA O BOTÃO
        if (botaoClicado) {
            setTimeout(() => {
                botaoClicado.innerHTML = botaoClicado._textoOriginal;
                botaoClicado.disabled = false;
            }, 500);
        }
    }
}

async function removerItemEstoque(id) {
    if (!confirm('Tem certeza que deseja remover este item do estoque?')) return;

    try {
        const resp = await apiPost('module=estoque&action=remover', { id });
        if (resp.success) {
            estoque = estoque.filter(i => Number(i.id) !== Number(id));
            atualizarInterfaceEstoque();
            alert('Item removido com sucesso!');
        } else {
            alert(resp.message || 'Erro ao remover item');
        }
    } catch (err) {
        console.error(err);
        alert('Erro ao remover item');
    }
}

function atualizarInterfaceEstoque() {
    estoque.forEach(item => {
        item.status = calcularStatus({
            quantidade: item.quantidade,
            minimo: item.minimo,
            maximo: item.maximo
        });
    });
    renderizarTabela();
    renderizarItensCriticos();
    renderizarItensMaximo();
    atualizarEstatisticas();
}

// ============================================================================
// SISTEMA SEMI-AUTOMÁTICO DE INTEGRAÇÃO ESTOQUE ↔ CARDÁPIO
// DESATIVA AUTOMATICAMENTE QUANDO:
// 1. Ingrediente não existe no estoque
// 2. Ingrediente está em estado crítico
// E ENVIA (0) PARA COLUNA DISPONÍVEL NO SQL QUANDO DESATIVADO
// ============================================================================

// ============================================================================
// CONFIGURAÇÃO
// ============================================================================

const INTERVALO_VERIFICACAO_MS = 5000;
const SYNC_MIN_INTERVAL_MS = 5 * 60 * 1000;
const _lastForceSync = {};

// ============================================================================
// UTILITÁRIOS
// ============================================================================

function tratarString(str) {
    if (!str && str !== 0) return "";
    let resultado = String(str).trim().replace(/^["']+|["']+$/g, '').trim();

    if (resultado.includes("\\u")) {
        try {
            return JSON.parse(`"${resultado}"`);
        } catch {
            return resultado.replace(/\\u([\dA-F]{4})/gi,
                (m, g) => String.fromCharCode(parseInt(g, 16))
            );
        }
    }
    return resultado;
}

function normalizarString(str) {
    if (str === undefined || str === null) return "";
    return tratarString(str)
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, " ")
        .replace(/[^\w\s]/g, "")
        .trim();
}

function extrairIngredienteQuantidade(str) {
    const t = tratarString(str);
    if (!t) return { nome: "", quantidadeNecessaria: 1 };
    if (t.includes(":")) {
        const [n, q] = t.split(":");
        return { nome: n.trim(), quantidadeNecessaria: parseInt(q) || 1 };
    }
    return { nome: t.trim(), quantidadeNecessaria: 1 };
}

// ============================================================================
// VERIFICAÇÃO DE ESTOQUE - SIMPLIFICADA
// ============================================================================

function verificarIngredientesDisponiveis(ingredientesTexto) {
    if (!ingredientesTexto || tratarString(ingredientesTexto).trim() === "") {
        return { disponivel: true, motivo: "", valorDisponivel: 1 };
    }

    const ingredientes = String(ingredientesTexto)
        .split(/[,;\n]/)
        .map(i => i.trim())
        .filter(Boolean);

    const naoExistem = [];
    const criticos = [];

    for (const ing of ingredientes) {
        const info = extrairIngredienteQuantidade(ing);
        const nomeNormal = normalizarString(info.nome);

        const itemEstoque = Array.isArray(estoque)
            ? estoque.find(e => normalizarString(e.item) === nomeNormal)
            : undefined;

        // ----- INGREDIENTE NÃO EXISTE NO ESTOQUE -----
        if (!itemEstoque) {
            naoExistem.push(info.nome);
            continue;
        }

        const qtt = Number(itemEstoque.quantidade);
        const min = Number(itemEstoque.minimo || 0);

        // ----- ESTADO CRÍTICO -----
        const isCritico = (
            (itemEstoque.status && String(itemEstoque.status).toLowerCase() === "critico")
            || qtt <= min
        );

        if (isCritico) {
            criticos.push(info.nome);
        }
    }

    // ----- MOTIVOS PARA DESATIVAR -----
    if (naoExistem.length > 0) {
        return {
            disponivel: false,
            motivo: "Ingredientes não cadastrados no estoque: " + naoExistem.join(", "),
            valorDisponivel: 0
        };
    }

    if (criticos.length > 0) {
        return {
            disponivel: false,
            motivo: "Ingredientes em estado crítico: " + criticos.join(", "),
            valorDisponivel: 0
        };
    }

    return { disponivel: true, motivo: "", valorDisponivel: 1 };
}

// ============================================================================
// ATUALIZAÇÃO NO SQL (CORRIGIDA - DISPONIVEL = 0, NÃO INGREDIENTES)
// ============================================================================

async function atualizarStatusNoSQL(itemId, novoStatus, motivo = "") {
    try {
        console.log(`🔄 Atualizando SQL: Item ${itemId} → ${novoStatus ? "ATIVO (1)" : "INATIVO (0)"} - Motivo: ${motivo}`);
        
        // CORREÇÃO: Apenas atualiza 'disponivel', não 'ingredientes'
        const payload = {
            id: itemId,
            disponivel: novoStatus ? 1 : 0,
            motivo: motivo || ""
        };
        
        // TENTATIVA 1: Usar ação atualizar_status
        try {
            const resposta = await apiPost("module=cardapio&action=atualizar_status", payload);
            if (resposta && resposta.success !== false) {
                console.log(`✅ SQL atualizado via atualizar_status: Item ${itemId} → ${novoStatus ? "ATIVO" : "INATIVO"}`);
                return true;
            }
        } catch (err1) {
            console.log("Tentativa 1 falhou:", err1.message || err1);
        }
        
        // TENTATIVA 2: Usar ação atualizar_completo
        try {
            const resposta = await apiPost("module=cardapio&action=atualizar_completo", payload);
            if (resposta && resposta.success !== false) {
                console.log(`✅ SQL atualizado via atualizar_completo: Item ${itemId} → ${novoStatus ? "ATIVO" : "INATIVO"}`);
                return true;
            }
        } catch (err2) {
            console.log("Tentativa 2 falhou:", err2.message || err2);
        }
        
        // TENTATIVA 3: Ações manuais específicas
        try {
            if (!novoStatus) {
                // Para desativar
                await apiPost("module=desativar_manual", {
                    id: itemId,
                    motivo: motivo || "Desativado automaticamente"
                });
                console.log(`✅ SQL atualizado via desativar_manual: Item ${itemId} → INATIVO`);
            } else {
                // Para ativar
                await apiPost("module=ativar_manual", { id: itemId });
                console.log(`✅ SQL atualizado via ativar_manual: Item ${itemId} → ATIVO`);
            }
            return true;
        } catch (err3) {
            console.log("Tentativa 3 falhou:", err3.message || err3);
        }
        
        // TENTATIVA 4: alternar_disponibilidade
        try {
            await apiPost("module=cardapio&action=alternar_disponibilidade", {
                id: itemId,
                motivo_indisponibilidade: motivo || ""
            });
            console.log(`✅ SQL atualizado via alternar_disponibilidade: Item ${itemId}`);
            return true;
        } catch (err4) {
            console.error("❌ Todas as tentativas falharam para item", itemId);
            return false;
        }
        
    } catch (err) {
        console.error("Erro ao atualizar SQL:", err);
        return false;
    }
}

// ============================================================================
// FUNÇÃO SIMPLIFICADA PARA DESATIVAR ITENS
// ============================================================================

async function desativarItemPorMotivo(itemId, motivo) {
    try {
        console.log(`🔧 Desativando item ${itemId}: ${motivo}`);
        
        const item = cardapio.find(i => Number(i.id) === Number(itemId));
        if (!item) {
            console.error("Item não encontrado:", itemId);
            return false;
        }
        
        // Atualiza no SQL
        const sucesso = await atualizarStatusNoSQL(itemId, false, motivo);
        
        if (sucesso) {
            // Atualiza localmente
            item.disponivel = 0;
            item.motivoIndisponibilidade = motivo;
            
            console.log(`✅ Item ${itemId} desativado com sucesso`);
            return true;
        }
        
        return false;
    } catch (err) {
        console.error("Erro ao desativar item:", err);
        return false;
    }
}

// ============================================================================
// FUNÇÃO PARA DESATIVAR AUTOMATICAMENTE
// ============================================================================

async function verificarEDesativarItensAutomaticamente() {
    if (!Array.isArray(estoque) || !Array.isArray(cardapio)) {
        console.warn("Estoque ou cardápio não carregados");
        return;
    }
    
    let desativados = 0;
    
    for (const item of cardapio) {
        // Verifica ingredientes
        const check = verificarIngredientesDisponiveis(item.ingredientes);
        const estaAtivo = Number(item.disponivel) === 1;
        
        // Se o item está ativo mas tem problemas, DESATIVA AUTOMATICAMENTE
        if (estaAtivo && !check.disponivel) {
            console.log(`⚠️ Desativando item ${item.id} ("${item.nome}") automaticamente: ${check.motivo}`);
            
            // Desativa o item
            await desativarItemPorMotivo(item.id, check.motivo);
            
            // Atualiza interface
            atualizarStatusNaInterface(item.id, false, check.motivo);
            
            desativados++;
        }
    }
    
    if (desativados > 0) {
        console.log(`✅ ${desativados} itens desativados automaticamente.`);
    }
}

// ============================================================================
// FUNÇÃO MELHORADA: VERIFICAR SE ITENS DESATIVADOS AGORA PODEM SER ATIVADOS
// ============================================================================

async function verificarSeItensPodemSerReativados() {
    if (!Array.isArray(estoque) || !Array.isArray(cardapio)) return;
    
    let itensQuePodemSerAtivados = [];
    let itensQueAindaTemProblemas = [];
    
    for (const item of cardapio) {
        // Só verifica itens que estão desativados
        if (Number(item.disponivel) === 0) {
            // Verifica TODOS os ingredientes do item
            const check = verificarIngredientesDisponiveis(item.ingredientes);
            
            // Se agora está disponível (TODOS os ingredientes existem e não estão críticos)
            if (check.disponivel) {
                itensQuePodemSerAtivados.push({
                    id: item.id,
                    nome: item.nome,
                    motivoAnterior: item.motivoIndisponibilidade,
                    status: "PODE_ATIVAR"
                });
                
                console.log(`✅ Item ${item.id} ("${item.nome}") agora pode ser ativado!`);
                console.log(`   Motivo anterior: ${item.motivoIndisponibilidade}`);
            } 
            // Se ainda tem problemas
            else if (!check.disponivel) {
                itensQueAindaTemProblemas.push({
                    id: item.id,
                    nome: item.nome,
                    motivoAtual: check.motivo,
                    status: "AINDA_DESATIVADO"
                });
                
                console.log(`❌ Item ${item.id} ("${item.nome}") ainda desativado: ${check.motivo}`);
            }
        }
    }
    
    // Mostra relatório completo
    console.log(`📊 RELATÓRIO DE ITENS DO CARDÁPIO:`);
    console.log(`   ✅ ${itensQuePodemSerAtivados.length} itens podem ser ativados`);
    console.log(`   ❌ ${itensQueAindaTemProblemas.length} itens ainda desativados`);
    
    return {
        podemSerAtivados: itensQuePodemSerAtivados,
        aindaTemProblemas: itensQueAindaTemProblemas
    };
}

// ============================================================================
// FUNÇÃO PRINCIPAL: ATIVAR/DESATIVAR MANUALMENTE
// ============================================================================

async function alternarStatusItemCardapio(itemId) {
    try {
        const item = cardapio.find(i => Number(i.id) === Number(itemId));
        if (!item) {
            console.error(`Item ${itemId} não encontrado`);
            return false;
        }
        
        const estaAtivo = Number(item.disponivel) === 1;
        
        if (estaAtivo) {
            // DESATIVAR MANUALMENTE
            return await desativarItemManualmente(itemId);
        } else {
            // ATIVAR MANUALMENTE
            return await ativarItemManualmente(itemId);
        }
    } catch (err) {
        console.error("Erro ao alternar status:", err);
        return false;
    }
}

async function desativarItemManualmente(itemId) {
    try {
        const item = cardapio.find(i => Number(i.id) === Number(itemId));
        if (!item) return false;
        
        // Atualiza localmente
        item.disponivel = 0;
        item.motivoIndisponibilidade = "Desativado manualmente";
        
        // Atualiza no SQL
        const sucessoSQL = await atualizarStatusNoSQL(itemId, false, "Desativado manualmente");
        
        // Atualiza interface
        atualizarStatusNaInterface(itemId, false, "Desativado manualmente");
        
        console.log(`✅ Item ${itemId} desativado manualmente`);
        return sucessoSQL;
    } catch (err) {
        console.error("Erro ao desativar item:", err);
        return false;
    }
}

async function ativarItemManualmente(itemId) {
    try {
        const item = cardapio.find(i => Number(i.id) === Number(itemId));
        if (!item) return false;
        
        // Verifica ingredientes
        const check = verificarIngredientesDisponiveis(item.ingredientes);
        
        // Se ainda tem problemas, não pode ativar
        if (!check.disponivel) {
            alert(`❌ Não é possível ativar "${item.nome}"!\n\nMotivo: ${check.motivo}`);
            return false;
        }
        
        // Atualiza localmente
        item.disponivel = 1;
        item.motivoIndisponibilidade = "";
        
        // Atualiza no SQL
        const sucessoSQL = await atualizarStatusNoSQL(itemId, true, "");
        
        // Atualiza interface
        atualizarStatusNaInterface(itemId, true, "");
        
        console.log(`✅ Item ${itemId} ativado manualmente`);
        return sucessoSQL;
    } catch (err) {
        console.error("Erro ao ativar item:", err);
        return false;
    }
}

// ============================================================================
// ATUALIZAÇÃO DA INTERFACE
// ============================================================================

function atualizarStatusNaInterface(itemId, ativo, motivo = "") {
    const item = cardapio.find(i => Number(i.id) === Number(itemId));
    if (!item) return;
    
    // Atualiza no array
    item.disponivel = ativo ? 1 : 0;
    item.motivoIndisponibilidade = motivo || "";
    
    // Atualiza na tabela
    const linha = document.querySelector(`tr[data-item-id="${itemId}"]`) || 
                  document.querySelector(`[data-cardapio-id="${itemId}"]`);
    
    if (linha) {
        // Atualiza a coluna de status (4ª coluna)
        const colunaStatus = linha.cells[3];
        if (colunaStatus) {
            if (ativo) {
                colunaStatus.innerHTML = '<span class="badge badge-success">✅ Disponível</span>';
            } else {
                colunaStatus.innerHTML = `<span class="badge badge-danger">❌ Indisponível</span>` +
                                       (motivo ? `<br><small style="color: #dc3545;">${motivo}</small>` : '');
            }
        }
        
        // Atualiza o botão (5ª coluna)
        const colunaAcoes = linha.cells[4];
        if (colunaAcoes) {
            const btnAtivarDesativar = colunaAcoes.querySelector('.btn-alternar-status');
            if (btnAtivarDesativar) {
                if (ativo) {
                    btnAtivarDesativar.innerHTML = '<span>Desativar</span>';
                    btnAtivarDesativar.className = 'btn btn-sm btn-warning btn-alternar-status';
                } else {
                    btnAtivarDesativar.innerHTML = '<span>Ativar</span>';
                    btnAtivarDesativar.className = 'btn btn-sm btn-success btn-alternar-status';
                }
            }
        }
    }
    
    // Atualiza estatísticas
    atualizarEstatisticasCardapio();
}

function atualizarEstatisticasCardapio() {
    if (!Array.isArray(cardapio)) return;
    
    const total = cardapio.length;
    const disponiveis = cardapio.filter(item => Number(item.disponivel) === 1).length;
    const indisponiveis = total - disponiveis;
    
    // Atualiza elementos na página
    const elementos = {
        'total-itens-cardapio': total,
        'itens-disponiveis': disponiveis,
        'itens-indisponiveis': indisponiveis,
        'contador-indisponiveis': indisponiveis
    };
    
    for (const [id, valor] of Object.entries(elementos)) {
        const elemento = document.getElementById(id);
        if (elemento) elemento.textContent = valor;
    }
    
    // Mostra/oculta alerta
    const alertaElement = document.getElementById('alert-cardapio');
    if (alertaElement) {
        alertaElement.style.display = indisponiveis > 0 ? 'block' : 'none';
    }
}

// ============================================================================
// FUNÇÃO PARA PREENCHER TABELA COM BOTÕES
// ============================================================================

function preencherTabelaCardapioComBotoes() {
    const corpoTabela = document.getElementById('corpo-tabela-cardapio');
    if (!corpoTabela || !Array.isArray(cardapio)) return;
    
    corpoTabela.innerHTML = '';
    
    cardapio.forEach(item => {
        const linha = document.createElement('tr');
        linha.setAttribute('data-item-id', item.id);
        
        // Status com ícone
        let statusHTML = '';
        if (Number(item.disponivel) === 1) {
            statusHTML = '<span class="badge badge-success">✅ Disponível</span>';
        } else {
            statusHTML = `<span class="badge badge-danger">❌ Indisponível</span>`;
            if (item.motivoIndisponibilidade) {
                statusHTML += `<br><small style="color: #dc3545; font-size: 0.85em;">${item.motivoIndisponibilidade}</small>`;
            }
        }
        
        // Texto do botão
        const textoBotao = Number(item.disponivel) === 1 ? 'Desativar' : 'Ativar';
        const classeBotao = Number(item.disponivel) === 1 ? 'btn-warning' : 'btn-success';
        
        linha.innerHTML = `
            <td>${item.nome || ''}</td>
            <td>${item.categoria || ''}</td>
            <td>R$ ${item.preco ? parseFloat(item.preco).toFixed(2) : '0.00'}</td>
            <td>${statusHTML}</td>
            <td>
                <button onclick="editarItemCardapio(${item.id})" class="btn btn-sm btn-primary">Editar</button>
                <button onclick="alternarStatusItemCardapio(${item.id})" 
                        class="btn btn-sm ${classeBotao} btn-alternar-status">
                    ${textoBotao}
                </button>
                <button onclick="excluirItemCardapio(${item.id})" class="btn btn-sm btn-danger">Excluir</button>
            </td>
        `;
        
        corpoTabela.appendChild(linha);
    });
    
    atualizarEstatisticasCardapio();
}

// ============================================================================
// MONITORAMENTO AUTOMÁTICO
// ============================================================================

let _intervalHandle = null;

function iniciarMonitoramentoAutomatico(intervalMs = INTERVALO_VERIFICACAO_MS) {
    if (_intervalHandle) clearInterval(_intervalHandle);
    
    // Verificação inicial
    verificarEDesativarItensAutomaticamente();
    verificarSeItensPodemSerReativados();
    
    // Verificação periódica
    _intervalHandle = setInterval(async () => {
        try {
            // Recarrega estoque primeiro
            await carregarEstoqueDoBackend();
            // Verifica e desativa automaticamente se necessário
            await verificarEDesativarItensAutomaticamente();
            // Verifica se itens desativados agora podem ser ativados
            await verificarSeItensPodemSerReativados();
        } catch (e) {
            console.error("Erro no monitoramento:", e);
        }
    }, intervalMs);
}

// ============================================================================
// BAIXA AUTOMÁTICA NO ESTOQUE
// ============================================================================

async function darBaixaEstoque(cardapioId, quantidade = 1) {
    if (!Array.isArray(cardapio) || !Array.isArray(estoque)) return false;

    const item = cardapio.find(i => Number(i.id) === Number(cardapioId));
    if (!item) return false;
    
    // Verifica se o item está ativo
    if (Number(item.disponivel) === 0) {
        console.warn(`Tentativa de venda do item ${cardapioId} que está desativado`);
        alert(`❌ "${item.nome}" está desativado e não pode ser vendido!`);
        return false;
    }

    const ingredientes = String(item.ingredientes || "")
        .split(/[,;\n]/)
        .map(i => i.trim())
        .filter(Boolean);

    const atualizacoes = [];

    for (const ing of ingredientes) {
        const info = extrairIngredienteQuantidade(ing);
        const normal = normalizarString(info.nome);

        const est = estoque.find(e => normalizarString(e.item) === normal);
        if (!est) continue;

        const baixar = Number(info.quantidadeNecessaria) * Number(quantidade || 1);

        atualizacoes.push({ id: est.id, delta: -Math.abs(baixar) });
    }

    try {
        for (const u of atualizacoes) {
            await apiPost("module=estoque&action=ajustar", {
                id: u.id,
                quantidade: u.delta,
                motivo: `Baixa automática - venda ${tratarString(item.nome)}`
            });
        }

        // Recarrega estoque e verifica automaticamente
        await carregarEstoqueDoBackend();
        await verificarEDesativarItensAutomaticamente();
        await verificarSeItensPodemSerReativados();

        return true;
    } catch (err) {
        console.error("Erro em darBaixaEstoque:", err);
        return false;
    }
}

// ============================================================================
// INICIALIZAÇÃO
// ============================================================================

function inicializarSistemaCardapio() {
    // Preenche a tabela com botões
    if (Array.isArray(cardapio)) {
        preencherTabelaCardapioComBotoes();
    }
    
    // Inicia monitoramento automático
    iniciarMonitoramentoAutomatico();
}

// ============================================================================
// FUNÇÃO MELHORADA: QUANDO INGREDIENTE É ADICIONADO
// ============================================================================

async function quandoIngredienteAdicionado() {
    console.log("📦 Novo ingrediente adicionado ao estoque. Verificando itens do cardápio...");
    
    // Recarrega o estoque do backend
    await carregarEstoqueDoBackend();
    
    // Verifica se itens desativados agora podem ser ativados
    const resultado = await verificarSeItensPodemSerReativados();
    
    // Também verifica se precisa desativar algum item ativo que agora tem problemas
    await verificarEDesativarItensAutomaticamente();
    
    console.log("✅ Verificação completa.");
}

// ============================================================================
// FUNÇÃO DE COMPATIBILIDADE
// ============================================================================

function verificarDisponibilidadeCardapio() {
    return verificarEDesativarItensAutomaticamente();
}

// ============================================================================
// EXPORTAR FUNÇÕES
// ============================================================================

window.alternarStatusItemCardapio = alternarStatusItemCardapio;
window.desativarItemManualmente = desativarItemManualmente;
window.ativarItemManualmente = ativarItemManualmente;
window.preencherTabelaCardapioComBotoes = preencherTabelaCardapioComBotoes;
window.inicializarSistemaCardapio = inicializarSistemaCardapio;
window.quandoIngredienteAdicionado = quandoIngredienteAdicionado;
window.verificarDisponibilidadeCardapio = verificarDisponibilidadeCardapio;

// ============================================================================
// EXECUTAR
// ============================================================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(inicializarSistemaCardapio, 1000);
    });
} else {
    setTimeout(inicializarSistemaCardapio, 1000);
}

// ============================================================================
// FIM
// ============================================================================


// ==================== SISTEMA DE CARDÁPIO ====================
let cardapio = [];
let editandoItemCardapioId = null;

// Função para verificar se uma string é um caminho de imagem
function isImagePath(string) {
    if (!string || string.trim() === '') return false;

    const str = string.trim();

    // É uma URL completa? (http://, https://, data:)
    try {
        new URL(str);
        return true;
    } catch (_) {
        // Não é uma URL completa, verifica se parece um caminho de imagem
    }

    const lowerStr = str.toLowerCase();

    // Verifica se parece um caminho de arquivo de imagem
    // Padrão 1: Termina com extensão de imagem conhecida
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.avif', '.svg'];
    const hasImageExtension = imageExtensions.some(ext => lowerStr.endsWith(ext));

    // Padrão 2: Contém "imagens/" ou "images/" e tem um nome de arquivo
    const hasImagesFolder = lowerStr.includes('imagens/') || lowerStr.includes('images/') || lowerStr.includes('img/');
    const hasFileName = str.split('/').pop().length > 0; // Pega a última parte após a última barra

    // Aceita se:
    // 1. Tem extensão de imagem OU
    // 2. Está em uma pasta de imagens e tem um nome de arquivo
    const isValid = (hasImageExtension || hasImagesFolder) && hasFileName;

    // Verifica se NÃO é uma URL web
    const isNotWebUrl = !str.includes('://') &&
        !lowerStr.startsWith('http') &&
        !lowerStr.startsWith('ftp') &&
        !lowerStr.startsWith('data:');

    return isValid && isNotWebUrl;
}

// Converte caminho local para URL web
function convertLocalPathToWebUrl(path) {
    if (!path || path.trim() === '') return '';

    const cleanPath = path.trim();

    // Se já for uma URL web, retorna como está
    if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://') || cleanPath.startsWith('data:')) {
        return cleanPath;
    }

    // Converte barras invertidas para barras normais (para web)
    let webPath = cleanPath.replace(/\\/g, '/');

    // Remove o prefixo do caminho absoluto se existir
    // Caso 1: Se começar com C:/, D:/, etc (Windows)
    if (/^[A-Za-z]:\//.test(webPath)) {
        // Encontra a parte após htdocs
        const htdocsIndex = webPath.toLowerCase().indexOf('htdocs/');
        if (htdocsIndex !== -1) {
            webPath = webPath.substring(htdocsIndex + 7); // +7 para remover "htdocs/"
        } else {
            // Se não encontrar htdocs, tenta encontrar o nome do projeto
            const projectIndex = webPath.toLowerCase().indexOf('projeto-integrador/');
            if (projectIndex !== -1) {
                webPath = webPath.substring(projectIndex);
            } else {
                // Se não encontrar, pega apenas o nome do arquivo
                const lastSlash = webPath.lastIndexOf('/');
                if (lastSlash !== -1) {
                    webPath = webPath.substring(lastSlash + 1);
                }
            }
        }
    }

    // Remove "./" do início se existir
    if (webPath.startsWith('./')) {
        webPath = webPath.substring(2);
    }

    // Remove "Projeto-integrador/" se estiver duplicado
    if (webPath.startsWith('Projeto-integrador/')) {
        webPath = webPath.substring('Projeto-integrador/'.length);
    }

    // Garante que não comece com "/"
    if (webPath.startsWith('/')) {
        webPath = webPath.substring(1);
    }

    // Se for apenas um nome de arquivo sem caminho, adiciona "imagens/"
    if (webPath.includes('/') === false) {
        // Não adiciona "imagens/" automaticamente para não forçar
        // O usuário deve especificar o caminho completo
        return webPath;
    }

    return webPath;
}

// Preview da imagem ao digitar URL
document.addEventListener('DOMContentLoaded', function () {
    const imagemInput = document.getElementById('item-cardapio-imagem');
    if (imagemInput) {
        imagemInput.addEventListener('input', function (e) {
            const previewDiv = document.getElementById('preview-imagem-cardapio');
            const img = previewDiv.querySelector('img');
            const url = e.target.value.trim();

            if (url && isImagePath(url)) {
                // Converte caminho local para URL web
                const webUrl = convertLocalPathToWebUrl(url);
                img.src = webUrl;
                previewDiv.style.display = 'block';

                // Adiciona tratamento de erro
                img.onerror = function () {
                    previewDiv.style.display = 'none';
                    console.warn('Não foi possível carregar a imagem:', webUrl);
                };
            } else {
                previewDiv.style.display = 'none';
            }
        });
    }
});

// Função para validar URL
function isValidUrl(string) {
    // Verifica se é uma URL válida (http/https)
    try {
        new URL(string);
        return true;
    } catch (_) {
        // Se não for URL válida, verifica se é um caminho de arquivo local
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.avif', '.svg'];
        const stringLower = string.toLowerCase();

        // Verifica se termina com extensão de imagem
        const hasImageExtension = imageExtensions.some(ext => stringLower.endsWith(ext));

        // Verifica se parece um caminho de arquivo
        const isLocalPath = !string.includes('://') &&
            !stringLower.startsWith('http') &&
            !stringLower.startsWith('ftp') &&
            !stringLower.startsWith('data:');

        return hasImageExtension && isLocalPath;
    }
}

async function carregarCardapioDoBackend() {
    try {
        const data = await apiGet('module=cardapio&action=listar');
        if (!Array.isArray(data)) {
            console.error("Cardápio retornou algo inválido:", data);
            cardapio = [];
            return;
        }

        cardapio = data.map(item => ({
            id: Number(item.id),
            nome: item.nome ?? "",
            preco: Number(item.preco ?? 0),
            categoria: item.categoria ?? "outro",
            imagem: item.imagem ? convertLocalPathToWebUrl(item.imagem) : "",
            descricao: item.descricao ?? "",
            ingredientes: item.ingredientes ?? "",
            disponivel: item.disponivel == 1 || item.disponivel === true || item.disponivel === "1",
            motivoIndisponibilidade: item.motivo_indisponibilidade ?? ""
        }));

        console.log("Cardápio carregado:", cardapio);

        // VERIFICAR DISPONIBILIDADE COM BASE NO ESTOQUE
        if (estoqueCarregado) {
            verificarDisponibilidadeCardapio();
        }

        atualizarInterfaceCardapio();
        atualizarSelectCardapio();
    } catch (err) {
        console.error("Erro ao carregar cardápio:", err);
        cardapio = [];
        atualizarSelectCardapio();
    }
}

function renderizarTabelaCardapio() {
    const corpo = document.getElementById('corpo-tabela-cardapio');
    if (!corpo) return;
    corpo.innerHTML = "";

    cardapio.forEach(item => {
        // Verificar ingredientes no estoque (se o estoque estiver carregado)
        let statusIngredientes = '';
        let temEstoque = true;

        if (estoqueCarregado && item.ingredientes) {
            const verificacao = verificarIngredientesDisponiveis(item.ingredientes);
            temEstoque = verificacao.disponivel;

            if (!temEstoque && item.disponivel) {
                // Se não tem estoque mas está marcado como disponível, mostrar alerta
                statusIngredientes = `<br><small class="text-danger">⚠️ ${verificacao.motivo.substring(0, 50)}...</small>`;
            }
        }

        const tr = document.createElement('tr');

        // Destacar linha se não tem estoque mas está marcado como disponível
        if (!temEstoque && item.disponivel) {
            tr.style.backgroundColor = '#fff5f5';
            tr.style.opacity = '0.8';
        }

        tr.innerHTML = `
            <td>
                ${item.imagem ?
                `<img src="${item.imagem}" 
                         alt="${item.nome}" 
                         style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px; margin-right: 8px; vertical-align: middle;"
                         onerror="this.style.display='none'">`
                : ''
            }
                <div style="display: inline-block; vertical-align: middle;">
                    <strong>${item.nome}</strong>
                    ${item.descricao ? `<br><small class="text-muted">${item.descricao}</small>` : ''}
                    ${item.ingredientes ? `<br><small><em>Ingredientes: ${item.ingredientes}</em></small>` : ''}
                    ${statusIngredientes}
                </div>
            </td>
            <td>${item.categoria}</td>
            <td>R$ ${item.preco.toFixed(2)}</td>
            <td>
                <span class="badge ${item.disponivel ? 'badge-success' : 'badge-danger'}">
                    ${item.disponivel ? 'Disponível' : 'Indisponível'}
                </span>
                ${!item.disponivel && item.motivoIndisponibilidade ?
                `<br><small class="text-danger">${item.motivoIndisponibilidade.substring(0, 50)}...</small>` : ''}
            </td>
            <td>
                <div class="btn-group">
                    <button class="btn btn-primary btn-sm" onclick="editarItemCardapio(${item.id})">Editar</button>
                    <button class="btn ${item.disponivel ? 'btn-warning btn-sm' : 'btn-success btn-sm'}" 
                            onclick="alternarDisponibilidade(${item.id})"
                            ${!temEstoque && item.disponivel ? 'disabled title="Falta estoque de ingredientes"' : ''}>
                        ${item.disponivel ? 'Desativar' : 'Ativar'}
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="removerItemCardapio(${item.id})">Deletar</button>
                </div>
            </td>
        `;

        corpo.appendChild(tr);
    });
}

function adicionarItemCardapio() {
    const nome = document.getElementById('item-cardapio-nome').value.trim();
    const precoInput = document.getElementById('item-cardapio-preco').value;
    const preco = parseFloat(precoInput);
    const categoria = document.getElementById('item-cardapio-categoria').value;
    const imagem = document.getElementById('item-cardapio-imagem').value.trim();
    const descricao = document.getElementById('item-cardapio-descricao').value.trim();
    const ingredientes = document.getElementById('item-cardapio-ingredientes').value.trim();
    const disponivel = document.getElementById('item-cardapio-disponivel').checked;

    // Validações
    if (!nome) {
        alert('Por favor, informe o nome do item!');
        document.getElementById('item-cardapio-nome').focus();
        return;
    }

    if (precoInput === '' || isNaN(preco) || preco < 0) {
        alert('Por favor, informe um preço válido!');
        document.getElementById('item-cardapio-preco').focus();
        return;
    }

    if (!descricao) {
        alert('Por favor, informe a descrição do item!');
        document.getElementById('item-cardapio-descricao').focus();
        return;
    }

    if (!ingredientes) {
        alert('Por favor, informe os ingredientes!');
        document.getElementById('item-cardapio-ingredientes').focus();
        return;
    }

    // Validar URL da imagem se fornecida - MENSAGEM MELHORADA
    if (imagem && !isImagePath(imagem)) {
        // Verifica se está faltando extensão
        const lowerImagem = imagem.toLowerCase();
        const hasImagesFolder = lowerImagem.includes('imagens/') || lowerImagem.includes('images/');
        const fileName = imagem.split('/').pop();

        let mensagem = 'Por favor, informe uma URL válida ou um caminho local para a imagem!\n\n';

        if (hasImagesFolder && fileName) {
            mensagem += `❌ O caminho "${imagem}" parece estar sem extensão.\n`;
            mensagem += `💡 Tente adicionar uma extensão como:\n`;
            mensagem += `   • ${imagem}.jpg\n`;
            mensagem += `   • ${imagem}.png\n`;
            mensagem += `   • ${imagem}.avif\n\n`;
        }

        mensagem += '📋 Exemplos válidos:\n';
        mensagem += '• URLs: https://exemplo.com/imagem.jpg\n';
        mensagem += '• Caminhos locais: imagens/Hambúrguer_Clássico.avif\n';
        mensagem += '• Caminhos locais: imagens/refrigerante.png\n';

        alert(mensagem);
        document.getElementById('item-cardapio-imagem').focus();
        return;
    }

    // Verificar se os ingredientes existem no estoque (se o estoque estiver carregado)
    if (estoqueCarregado && ingredientes) {
        const verificacao = verificarIngredientesDisponiveis(ingredientes);
        if (!verificacao.disponivel) {
            const confirmar = confirm(`⚠️ Atenção: Alguns ingredientes não estão disponíveis no estoque:\n\n${verificacao.motivo}\n\nDeseja adicionar o item mesmo assim?`);
            if (!confirmar) {
                return;
            }
        }
    }

    // Converte o caminho antes de enviar
    const imagemConvertida = imagem ? convertLocalPathToWebUrl(imagem) : null;

    const payload = {
        nome: nome,
        preco: preco,
        categoria: categoria,
        imagem: imagemConvertida || null,
        descricao: descricao,
        ingredientes: ingredientes,
        disponivel: disponivel ? 1 : 0
    };

    if (editandoItemCardapioId) {
        // Modo edição
        payload.id = editandoItemCardapioId;
        apiPost('module=cardapio&action=atualizar', payload)
            .then(res => {
                if (res.success) {
                    alert('Item atualizado com sucesso!');
                    carregarCardapioDoBackend();
                    cancelarEdicaoCardapio();
                } else {
                    alert('Erro ao atualizar item: ' + res.message);
                }
            })
            .catch(err => {
                console.error('Erro ao atualizar item:', err);
                alert('Erro ao conectar com o servidor');
            });
    } else {
        // Modo adição
        apiPost('module=cardapio&action=adicionar', payload)
            .then(res => {
                if (res.success) {
                    alert('Item adicionado ao cardápio com sucesso!');
                    carregarCardapioDoBackend();
                    limparFormularioCardapio();
                } else {
                    alert('Erro ao adicionar item: ' + res.message);
                }
            })
            .catch(err => {
                console.error('Erro ao adicionar item:', err);
                alert('Erro ao conectar com o servidor');
            });
    }
}

function editarItemCardapio(id) {
    const item = cardapio.find(i => i.id === id);
    if (item) {
        editandoItemCardapioId = id;

        // Preencher formulário
        document.getElementById('item-cardapio-nome').value = item.nome;
        document.getElementById('item-cardapio-preco').value = item.preco;
        document.getElementById('item-cardapio-categoria').value = item.categoria;
        document.getElementById('item-cardapio-imagem').value = item.imagem || '';
        document.getElementById('item-cardapio-descricao').value = item.descricao;
        document.getElementById('item-cardapio-ingredientes').value = item.ingredientes || '';
        document.getElementById('item-cardapio-disponivel').checked = item.disponivel;

        // Atualizar preview se houver imagem
        const previewDiv = document.getElementById('preview-imagem-cardapio');
        const img = previewDiv.querySelector('img');
        if (item.imagem && isImagePath(item.imagem)) {
            img.src = item.imagem;
            previewDiv.style.display = 'block';
        } else {
            previewDiv.style.display = 'none';
        }

        // Atualizar interface do formulário
        document.getElementById('form-titulo-cardapio').textContent = '✏️ Editar Item do Cardápio';
        document.getElementById('btn-adicionar-cardapio').textContent = 'Atualizar Item';
        document.getElementById('btn-cancelar-cardapio').style.display = 'inline-block';

        // Scroll para o formulário
        document.getElementById('form-container-cardapio').scrollIntoView({ behavior: 'smooth' });
    }
}

function cancelarEdicaoCardapio() {
    editandoItemCardapioId = null;
    document.getElementById('form-titulo-cardapio').textContent = '➕ Adicionar Novo Item ao Cardápio';
    document.getElementById('btn-adicionar-cardapio').textContent = 'Adicionar Item';
    document.getElementById('btn-cancelar-cardapio').style.display = 'none';
    limparFormularioCardapio();
}

function limparFormularioCardapio() {
    document.getElementById('item-cardapio-nome').value = '';
    document.getElementById('item-cardapio-preco').value = '';
    document.getElementById('item-cardapio-categoria').value = 'hamburguer';
    document.getElementById('item-cardapio-imagem').value = '';
    document.getElementById('item-cardapio-descricao').value = '';
    document.getElementById('item-cardapio-ingredientes').value = '';
    document.getElementById('item-cardapio-disponivel').checked = true;

    // Limpar preview
    const previewDiv = document.getElementById('preview-imagem-cardapio');
    if (previewDiv) {
        previewDiv.style.display = 'none';
        const img = previewDiv.querySelector('img');
        if (img) img.src = '';
    }
}

function alternarDisponibilidade(id) {
    const item = cardapio.find(i => i.id === id);
    if (!item) return;

    // Verificar se há ingredientes disponíveis antes de ativar
    if (!item.disponivel && estoqueCarregado && item.ingredientes) {
        const verificacao = verificarIngredientesDisponiveis(item.ingredientes);
        if (!verificacao.disponivel) {
            alert(`❌ Não é possível ativar este item. Motivo:\n\n${verificacao.motivo}`);
            return;
        }
    }

    apiPost('module=cardapio&action=alternar_disponibilidade', { id })
        .then(res => {
            if (res.success) {
                item.disponivel = !item.disponivel;
                // Se estiver ativando e não tiver motivo, limpar o motivo
                if (item.disponivel) {
                    item.motivoIndisponibilidade = '';
                }
                renderizarTabelaCardapio();
                atualizarEstatisticasCardapio();
                renderizarItensIndisponiveis();
                atualizarSelectCardapio();
            } else {
                alert('Erro ao alterar disponibilidade: ' + res.message);
            }
        })
        .catch(err => {
            console.error('Erro ao alternar disponibilidade:', err);
            alert('Erro ao conectar com o servidor');
        });
}

function removerItemCardapio(id) {
    if (!confirm('Tem certeza que deseja remover este item do cardápio?')) return;

    apiPost('module=cardapio&action=remover', { id })
        .then(res => {
            if (res.success) {
                cardapio = cardapio.filter(i => i.id !== id);
                atualizarInterfaceCardapio();
                atualizarSelectCardapio();
                alert('Item removido do cardápio com sucesso!');
            } else {
                alert('Erro ao remover item: ' + res.message);
            }
        })
        .catch(err => {
            console.error('Erro ao remover item:', err);
            alert('Erro ao conectar com o servidor');
        });
}

function atualizarEstatisticasCardapio() {
    const total = cardapio.length;
    const disp = cardapio.filter(i => i.disponivel).length;
    const indis = total - disp;

    const elementos = {
        'total-itens-cardapio': total,
        'itens-disponiveis': disp,
        'itens-indisponiveis': indis,
        'contador-indisponiveis': indis
    };

    Object.entries(elementos).forEach(([id, valor]) => {
        const el = document.getElementById(id);
        if (el) el.textContent = valor;
    });

    const alertCard = document.getElementById('alert-cardapio');
    if (alertCard) {
        alertCard.style.display = indis > 0 ? 'flex' : 'none';
    }
}

function renderizarItensIndisponiveis() {
    const lista = document.getElementById('lista-indisponiveis');
    if (!lista) return;

    const itens = cardapio.filter(i => !i.disponivel);
    lista.innerHTML = "";

    const card = document.getElementById('card-indisponiveis');
    if (card) card.style.display = itens.length > 0 ? 'block' : 'none';

    itens.forEach(item => {
        const div = document.createElement('div');
        div.className = 'alert alert-danger';
        div.innerHTML = `
            ${item.imagem ? `<img src="${item.imagem}" alt="${item.nome}" style="width: 30px; height: 30px; object-fit: cover; border-radius: 4px; margin-right: 8px; vertical-align: middle;" onerror="this.style.display='none'">` : ''}
            <strong>${item.nome}</strong><br>
            <small>${item.motivoIndisponibilidade || 'Indisponível'}</small>
            <button class="btn btn-success" style="float: right;" onclick="alternarDisponibilidade(${item.id})">Ativar</button>
        `;
        lista.appendChild(div);
    });
}

function atualizarInterfaceCardapio() {
    renderizarTabelaCardapio();
    renderizarItensIndisponiveis();
    atualizarEstatisticasCardapio();
}

function atualizarSelectCardapio() {
    const select = document.getElementById('item-cardapio-pedido');
    if (!select) return;

    select.innerHTML = '<option value="">Selecione</option>';

    cardapio.filter(item => item.disponivel).forEach(item => {
        // Verificar se há ingredientes disponíveis (se o estoque estiver carregado)
        let podeVender = true;
        if (estoqueCarregado && item.ingredientes) {
            const verificacao = verificarIngredientesDisponiveis(item.ingredientes);
            podeVender = verificacao.disponivel;
        }

        if (podeVender) {
            const option = document.createElement('option');
            option.value = item.id;
            option.textContent = `${item.nome} - R$ ${item.preco.toFixed(2)} (${item.categoria})`;
            select.appendChild(option);
        }
    });
}

// ==================== SISTEMA DE PEDIDOS ATUALIZADO ====================
let pedidos = [];
let pedidosFiltrados = [];
let intervaloAtualizacao = null;
let modalVisivel = false;

// Função para formatar data no formato brasileiro (dd/mm/yyyy)
function formatarDataBrasileira(dataString) {
    if (!dataString) return '';
    
    // Se já estiver no formato dd/mm/yyyy, retorna como está
    if (dataString.includes('/')) {
        return dataString;
    }
    
    // Se estiver no formato yyyy-mm-dd (como 2025-12-20)
    if (dataString.includes('-')) {
        const partes = dataString.split('-');
        if (partes.length === 3) {
            return `${partes[2]}/${partes[1]}/${partes[0]}`;
        }
    }
    
    return dataString; // Retorna original se não conseguir formatar
}

// Função para formatar horário sem segundos (hh:mm)
function formatarHorarioSemSegundos(horario) {
    if (!horario) return '';
    
    // Remove a parte da data se houver
    const partes = horario.split(' ');
    const horaCompleta = partes.length > 1 ? partes[1] : horario;
    
    // Remove os segundos (últimos 3 caracteres ":ss")
    if (horaCompleta.includes(':') && horaCompleta.split(':').length === 3) {
        return horaCompleta.substring(0, 5); // Pega apenas "hh:mm"
    }
    
    return horaCompleta;
}

async function carregarPedidos() {
    try {
        const data = await apiGet('module=pedidos&action=listar');
        console.log('Dados recebidos dos pedidos:', data); // Para debug
        
        if (Array.isArray(data)) {
            // CONVERTE "aberto" ou status vazio para "preparo" no frontend
            pedidos = data.map(pedido => ({
                ...pedido,
                // Se status for "aberto", vazio, nulo ou undefined, converte para "preparo"
                status: (pedido.status === 'aberto' || 
                        pedido.status === '' || 
                        pedido.status === null || 
                        pedido.status === undefined || 
                        pedido.status === ' ') ? 'preparo' : pedido.status
            }));
            
            pedidosFiltrados = [...pedidos]; // Inicializa com todos os pedidos
            atualizarListaPedidos();
            atualizarEstatisticasPedidos();
            atualizarFiltrosStatus();
            
            // Inicia atualização automática
            iniciarAtualizacaoAutomatica();
        }
    } catch (err) {
        console.error('Erro ao carregar pedidos:', err);
        pedidos = [];
        pedidosFiltrados = [];
    }
}

function atualizarListaPedidos() {
    const tabela = document.querySelector('#pedidos .table-container tbody');
    if (!tabela) return;

    tabela.innerHTML = '';

    if (pedidosFiltrados.length === 0) {
        tabela.innerHTML = `
            <tr id="mensagem-sem-pedidos">
                <td colspan="8" style="text-align:center; padding: 40px; color: #999;">
                    <div style="display: flex; flex-direction: column; align-items: center; gap: 10px;">
                        <i class="fas fa-clipboard-list" style="font-size: 48px; opacity: 0.5;"></i>
                        <span>Nenhum pedido encontrado com os filtros selecionados.</span>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    // Ordena pedidos: Primeiro por data (mais recente), depois por horário (mais recente)
    const pedidosOrdenados = [...pedidosFiltrados].sort((a, b) => {
        // Primeiro: Ordena por status (preparo primeiro)
        if (a.status === 'preparo' && b.status !== 'preparo') return -1;
        if (a.status !== 'preparo' && b.status === 'preparo') return 1;
        
        // Segundo: Ordena por data (mais recente primeiro)
        const dataA = a.data_pedido || '';
        const dataB = b.data_pedido || '';
        
        // Converte para timestamp para comparação correta
        const timestampA = dataA ? new Date(dataA).getTime() : 0;
        const timestampB = dataB ? new Date(dataB).getTime() : 0;
        
        if (timestampA !== timestampB) {
            return timestampB - timestampA; // Mais recente primeiro
        }
        
        // Terceiro: Se mesma data, ordena por horário (mais recente primeiro)
        const horaA = a.horario_pedido || '00:00:00';
        const horaB = b.horario_pedido || '00:00:00';
        
        // Converte horário para segundos para comparação
        const segundosA = horaParaSegundos(horaA);
        const segundosB = horaParaSegundos(horaB);
        
        return segundosB - segundosA; // Mais recente primeiro
    });

    // Função auxiliar para converter horário em segundos
    function horaParaSegundos(hora) {
        if (!hora) return 0;
        
        // Remove a parte da data se houver
        const horaFormatada = hora.split(' ')[1] || hora;
        const partes = horaFormatada.split(':');
        
        if (partes.length < 2) return 0;
        
        const horas = parseInt(partes[0]) || 0;
        const minutos = parseInt(partes[1]) || 0;
        const segundos = parseInt(partes[2]) || 0;
        
        return (horas * 3600) + (minutos * 60) + segundos;
    }

    pedidosOrdenados.forEach(pedido => {
        const tr = document.createElement('tr');
        tr.dataset.pedidoId = pedido.id;
        
        // Destaca pedidos em preparo
        if (pedido.status === 'preparo') {
            tr.style.backgroundColor = '#fff8e1';
            tr.style.borderLeft = '4px solid #ffc107';
        }
        
        tr.innerHTML = `
            <td><strong>${pedido.numero_pedido || '#' + pedido.id}</strong></td>
            <td>${pedido.nome_cliente || 'N/A'}</td>
            <td>${pedido.tipo || 'N/A'}</td>
            <td><strong>R$ ${parseFloat(pedido.total || 0).toFixed(2)}</strong></td>
            <td>
                <select class="status-select form-control form-control-sm" 
                        onchange="mudarStatusPedido(this, ${pedido.id})"
                        style="background-color: ${getCorStatus(pedido.status)}; 
                               color: ${getCorTextoStatus(pedido.status)};
                               font-weight: 600;
                               border: 1px solid ${getBordaStatus(pedido.status)};">
                    <option value="preparo" ${pedido.status === 'preparo' ? 'selected' : ''}>Preparo</option>
                    <option value="pronto" ${pedido.status === 'pronto' ? 'selected' : ''}>Pronto</option>
                    <option value="entregue" ${pedido.status === 'entregue' ? 'selected' : ''}>Entregue</option>
                    <option value="cancelado" ${pedido.status === 'cancelado' ? 'selected' : ''}>Cancelado</option>
                </select>
            </td>
            <td>${formatarDataBrasileira(pedido.data_pedido) || ''}</td>
            <td>${formatarHorarioSemSegundos(pedido.horario_pedido) || ''}</td>
            <td>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-danger" onclick="visualizarPedido(${pedido.id})" title="Ver detalhes">
                        <i class="fas fa-eye"></i> Ver
                    </button>
                </div>
            </td>
        `;
        tabela.appendChild(tr);
    });
}
function mudarStatusPedido(selectElement, pedidoId) {
    const novoStatusFrontend = selectElement.value; // "preparo", "pronto", etc
    const pedido = pedidos.find(p => p.id === pedidoId);
    
    if (!pedido) {
        mostrarNotificacao('Pedido não encontrado!', 'danger');
        return;
    }

    // CONVERTE "preparo" para "aberto" para o banco de dados
    const statusParaBanco = (novoStatusFrontend === 'preparo') ? 'aberto' : novoStatusFrontend;
    
    // Confirmação para status críticos
    if (novoStatusFrontend === 'cancelado') {
        if (!confirm(`Tem certeza que deseja cancelar o pedido ${pedido.numero_pedido || '#' + pedido.id}?`)) {
            selectElement.value = pedido.status;
            return;
        }
    }

    // Atualiza cor do select imediatamente para feedback visual
    selectElement.style.backgroundColor = getCorStatus(novoStatusFrontend);
    selectElement.style.color = getCorTextoStatus(novoStatusFrontend);

    // Envia para API - ENVIA "aberto" para o banco quando for "preparo"
    apiPost('module=pedidos&action=atualizar_status', {
        id: pedidoId,
        status: statusParaBanco, // Aqui envia "aberto" para o banco
        horario_alteracao: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    })
    .then(res => {
        if (res.success) {
            // Atualiza o pedido localmente (mantém "preparo" no frontend)
            pedido.status = novoStatusFrontend; // Frontend continua com "preparo"
            pedido.horario_status = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            
            // Atualiza estatísticas e filtros
            atualizarEstatisticasPedidos();
            atualizarFiltrosStatus();
            
            // Reaplica filtro atual
            const btnAtivo = document.querySelector('#filtros-status-pedidos .btn-filter.active');
            if (btnAtivo) {
                filtrarPedidosPorStatus(btnAtivo.dataset.status);
            }
            
            console.log(`Status do pedido ${pedido.numero_pedido || '#' + pedidoId} alterado para: ${novoStatusFrontend} (no banco: ${statusParaBanco})`);
            
            // Notificação de sucesso
            mostrarNotificacao(`Status alterado para: ${formatarStatus(novoStatusFrontend)}`, 'success');
        } else {
            mostrarNotificacao('Erro ao atualizar status: ' + res.message, 'danger');
            // Reverte o select
            selectElement.value = pedido.status;
            selectElement.style.backgroundColor = getCorStatus(pedido.status);
            selectElement.style.color = getCorTextoStatus(pedido.status);
        }
    })
    .catch(err => {
        console.error('Erro ao atualizar status:', err);
        mostrarNotificacao('Erro ao conectar com o servidor', 'danger');
        // Reverte o select
        selectElement.value = pedido.status;
        selectElement.style.backgroundColor = getCorStatus(pedido.status);
        selectElement.style.color = getCorTextoStatus(pedido.status);
    });
}

// ==================== ATUALIZAÇÃO AUTOMÁTICA ====================
function iniciarAtualizacaoAutomatica() {
    // Para qualquer intervalo anterior
    if (intervaloAtualizacao) {
        clearInterval(intervaloAtualizacao);
    }
    
    // Atualiza a cada 5 segundos
    intervaloAtualizacao = setInterval(async () => {
        try {
            const data = await apiGet('module=pedidos&action=listar');
            
            if (Array.isArray(data)) {
                // Verifica se há mudanças
                const novosPedidos = data.map(pedido => ({
                    ...pedido,
                    // Converte "aberto" ou vazio para "preparo" no frontend
                    status: (pedido.status === 'aberto' || 
                            pedido.status === '' || 
                            pedido.status === null || 
                            pedido.status === undefined || 
                            pedido.status === ' ') ? 'preparo' : pedido.status
                }));
                
                // Compara para ver se precisa atualizar
                const precisaAtualizar = JSON.stringify(pedidos) !== JSON.stringify(novosPedidos);
                
                if (precisaAtualizar) {
                    console.log('Atualizando pedidos automaticamente...');
                    pedidos = novosPedidos;
                    pedidosFiltrados = [...pedidos];
                    
                    atualizarListaPedidos();
                    atualizarEstatisticasPedidos();
                    atualizarFiltrosStatus();
                    
                    // Notificação visual sutil
                    mostrarNotificacaoAtualizacao();
                }
            }
        } catch (err) {
            console.error('Erro na atualização automática:', err);
        }
    }, 5000); // 5 segundos
}

function mostrarNotificacaoAtualizacao() {
    // Remove notificação anterior se existir
    const notificacaoAnterior = document.getElementById('notificacao-atualizacao');
    if (notificacaoAnterior) {
        notificacaoAnterior.remove();
    }
    
    // Cria nova notificação
    const notificacao = document.createElement('div');
    notificacao.id = 'notificacao-atualizacao';
    notificacao.innerHTML = `
        <div style="position: fixed; top: 10px; right: 10px; background: #28a745; color: white; padding: 8px 16px; border-radius: 4px; box-shadow: 0 2px 5px rgba(0,0,0,0.2); z-index: 9999; font-size: 14px; animation: fadeInOut 2s ease;">
            <i class="fas fa-sync-alt"></i> Pedidos atualizados
        </div>
    `;
    
    document.body.appendChild(notificacao);
    
    // Remove após 2 segundos
    setTimeout(() => {
        if (notificacao.parentNode) {
            notificacao.remove();
        }
    }, 2000);
}

function mostrarNotificacao(mensagem, tipo = 'info') {
    // Remove notificação anterior se existir
    const notificacaoAnterior = document.querySelector('.notificacao-temporaria');
    if (notificacaoAnterior) {
        notificacaoAnterior.remove();
    }
    
    // Cria nova notificação
    const notificacao = document.createElement('div');
    notificacao.className = 'notificacao-temporaria';
    notificacao.innerHTML = `
        <div style="position: fixed; top: 50px; right: 10px; background: ${tipo === 'success' ? '#28a745' : tipo === 'danger' ? '#dc3545' : '#17a2b8'}; 
                    color: white; padding: 12px 20px; border-radius: 4px; box-shadow: 0 2px 10px rgba(0,0,0,0.3); z-index: 9999; font-size: 14px;">
            <i class="fas ${tipo === 'success' ? 'fa-check-circle' : tipo === 'danger' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i> 
            ${mensagem}
        </div>
    `;
    
    document.body.appendChild(notificacao);
    
    // Remove após 3 segundos
    setTimeout(() => {
        if (notificacao.parentNode) {
            notificacao.remove();
        }
    }, 3000);
}

function atualizarEstatisticasPedidos() {
    // Considera "preparo" como status para pedidos em aberto ou vazio
    const preparo = pedidos.filter(p => p.status === 'preparo').length;
    const prontos = pedidos.filter(p => p.status === 'pronto').length;
    const entregues = pedidos.filter(p => p.status === 'entregue').length;
    const cancelados = pedidos.filter(p => p.status === 'cancelado').length;
    const total = pedidos.length;

    const elementos = {
        'pedidos-preparo': preparo,
        'pedidos-prontos': prontos,
        'pedidos-entregues': entregues,
        'total-pedidos': total
    };

    Object.entries(elementos).forEach(([id, valor]) => {
        const el = document.getElementById(id);
        if (el) {
            el.textContent = valor;
            // Animação sutil quando atualiza
            el.classList.add('pulse-animation');
            setTimeout(() => el.classList.remove('pulse-animation'), 500);
        }
    });
    
    // Atualiza título da seção com contador de preparo
    const titulo = document.querySelector('#pedidos .section-title');
    if (titulo && preparo > 0) {
        const spanExistente = titulo.querySelector('.badge-preparo-count');
        if (!spanExistente) {
            const badge = document.createElement('span');
            badge.className = 'badge badge-warning badge-preparo-count ml-2';
            badge.textContent = `${preparo} em preparo`;
            titulo.appendChild(badge);
        } else {
            spanExistente.textContent = `${preparo} em preparo`;
        }
    } else if (titulo) {
        const spanExistente = titulo.querySelector('.badge-preparo-count');
        if (spanExistente) {
            spanExistente.remove();
        }
    }
}

function atualizarFiltrosStatus() {
    const containerFiltros = document.getElementById('filtros-status-pedidos');
    if (!containerFiltros) {
        criarContainerFiltros();
        return;
    }

    // Atualiza contadores nos botões de filtro
    const contadores = {
        'todos': pedidos.length,
        'preparo': pedidos.filter(p => p.status === 'preparo').length, // Só "preparo"
        'pronto': pedidos.filter(p => p.status === 'pronto').length,
        'entregue': pedidos.filter(p => p.status === 'entregue').length,
        'cancelado': pedidos.filter(p => p.status === 'cancelado').length
    };

    Object.entries(contadores).forEach(([status, contador]) => {
        const btn = document.querySelector(`[data-status="${status}"]`);
        if (btn) {
            const badge = btn.querySelector('.badge-contador') || document.createElement('span');
            badge.className = 'badge badge-light badge-contador ml-1';
            badge.textContent = contador;
            if (!btn.querySelector('.badge-contador')) {
                btn.appendChild(badge);
            } else {
                btn.querySelector('.badge-contador').textContent = contador;
            }
            
            // Atualiza cor do badge baseado no status
            badge.style.background = getCorStatus(status) + '20';
            badge.style.color = getCorStatus(status);
        }
    });
}

function criarContainerFiltros() {
    const sectionPedidos = document.getElementById('pedidos');
    if (!sectionPedidos) return;

    let filtrosContainer = document.getElementById('filtros-status-pedidos');
    
    if (!filtrosContainer) {
        const tableContainer = sectionPedidos.querySelector('.table-container');
        if (!tableContainer) return;
        
        filtrosContainer = document.createElement('div');
        filtrosContainer.id = 'filtros-status-pedidos';
        filtrosContainer.className = 'filtros-pedidos mb-3';
        filtrosContainer.style.cssText = `
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 10px;
            padding: 12px 15px;
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            border-radius: 8px;
            border: 1px solid #dee2e6;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        `;
        
        tableContainer.parentNode.insertBefore(filtrosContainer, tableContainer);
    }

    const filtros = [
        { status: 'todos', label: 'Todos', icon: 'fas fa-list', cor: '#6c757d' },
        { status: 'preparo', label: 'Em Preparo', icon: 'fas fa-clock', cor: '#ffc107' },
        { status: 'pronto', label: 'Prontos', icon: 'fas fa-check-circle', cor: '#17a2b8' },
        { status: 'entregue', label: 'Entregues', icon: 'fas fa-truck', cor: '#28a745' },
        { status: 'cancelado', label: 'Cancelados', icon: 'fas fa-times-circle', cor: '#dc3545' }
    ];

    filtrosContainer.innerHTML = `
        <span style="font-weight: 600; color: #495057; margin-right: 5px;">
            <i class="fas fa-filter"></i> Filtrar:
        </span>
        <div style="display: flex; flex-wrap: wrap; gap: 6px; flex: 1;">
            ${filtros.map(filtro => `
                <button class="btn btn-filter ${filtro.status === 'todos' ? 'active' : ''}" 
                        data-status="${filtro.status}"
                        onclick="filtrarPedidosPorStatus('${filtro.status}')"
                        style="background: ${filtro.status === 'todos' ? filtro.cor + '20' : 'white'};
                               border: 1px solid ${filtro.cor}40;
                               color: #495057;
                               padding: 6px 12px;
                               font-size: 0.875rem;
                               border-radius: 20px;
                               transition: all 0.2s;
                               display: inline-flex;
                               align-items: center;
                               gap: 5px;">
                    <i class="${filtro.icon}" style="color: ${filtro.cor};"></i>
                    ${filtro.label}
                    <span class="badge badge-light badge-contador ml-1" style="
                        background: ${filtro.cor}15;
                        color: ${filtro.cor};
                        font-size: 0.75rem;
                        padding: 2px 6px;
                        border-radius: 10px;">0</span>
                </button>
            `).join('')}
        </div>
                <div style="display: flex; align-items: center; gap: 8px;">
            <!-- BOTÃO DE ATUALIZAR MANUALMENTE COM SÍMBOLO 🔄 -->
            <button class="btn btn-outline-secondary btn-sm" onclick="carregarPedidos()" title="Atualizar manualmente"
                    style="padding: 6px 10px; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 18px;">🔄</span>
            </button>
        </div>
    `;

    const style = document.createElement('style');
    style.textContent = `
        .btn-filter {
            transition: all 0.3s ease;
        }
        .btn-filter:hover {
            transform: translateY(-2px);
            box-shadow: 0 3px 8px rgba(0,0,0,0.15);
        }
        .btn-filter.active {
            color: white !important;
            background: linear-gradient(135deg, var(--cor-botao) 0%, var(--cor-botao-escuro) 100%) !important;
            font-weight: 600;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        }
        .btn-filter.active i {
            color: white !important;
        }
        .btn-filter.active .badge-contador {
            background: rgba(255,255,255,0.3) !important;
            color: white !important;
        }
        .pulse-animation {
            animation: pulse 0.5s ease-in-out;
        }
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
        }
        @keyframes fadeInOut {
            0% { opacity: 0; transform: translateY(-10px); }
            10% { opacity: 1; transform: translateY(0); }
            90% { opacity: 1; transform: translateY(0); }
            100% { opacity: 0; transform: translateY(-10px); }
        }
    `;
    document.head.appendChild(style);

    // Aplica cores dinâmicas
    setTimeout(() => {
        filtros.forEach(filtro => {
            const btn = document.querySelector(`[data-status="${filtro.status}"]`);
            if (btn) {
                btn.style.setProperty('--cor-botao', filtro.cor);
                btn.style.setProperty('--cor-botao-escuro', escurecerCor(filtro.cor, 20));
            }
        });
    }, 100);
}

function filtrarPedidosPorStatus(status) {
    // Atualiza botões ativos
    document.querySelectorAll('#filtros-status-pedidos .btn-filter').forEach(btn => {
        btn.classList.remove('active');
        btn.style.background = 'white';
    });
    
    // Ativa botão selecionado
    const btnAtivo = document.querySelector(`[data-status="${status}"]`);
    if (btnAtivo) {
        btnAtivo.classList.add('active');
    }
    
    // Aplica filtro
    if (status === 'todos') {
        pedidosFiltrados = [...pedidos];
    } else {
        pedidosFiltrados = pedidos.filter(p => p.status === status);
    }
    
    atualizarListaPedidos();
}

function escurecerCor(cor, percentual) {
    let r = parseInt(cor.substring(1, 3), 16);
    let g = parseInt(cor.substring(3, 5), 16);
    let b = parseInt(cor.substring(5, 7), 16);
    
    r = Math.floor(r * (100 - percentual) / 100);
    g = Math.floor(g * (100 - percentual) / 100);
    b = Math.floor(b * (100 - percentual) / 100);
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// ==================== FUNÇÕES AUXILIARES ====================

function getCorStatus(status) {
    const cores = {
        'preparo': '#ffc107',       // Amarelo para preparo (aberto/vazio)
        'pronto': '#17a2b8',        // Azul
        'entregue': '#28a745',      // Verde
        'cancelado': '#dc3545',     // Vermelho
        'todos': '#6c757d'          // Cinza
    };
    return cores[status] || '#6c757d';
}

function getBordaStatus(status) {
    const bordas = {
        'preparo': '#ff9800',       // Laranja para preparo
        'pronto': '#0d8abc',        // Azul escuro
        'entregue': '#1e7e34',      // Verde escuro
        'cancelado': '#bd2130'      // Vermelho escuro
    };
    return bordas[status] || '#dee2e6';
}

function getCorTextoStatus(status) {
    if (status === 'preparo') {
        return '#856404'; // Texto escuro para fundo amarelo
    }
    return '#ffffff'; // Texto branco para outras cores
}

function getClasseStatus(status) {
    const classes = {
        'preparo': 'warning',      // Para pedidos em preparo (aberto/vazio)
        'pronto': 'info',
        'entregue': 'success',
        'cancelado': 'danger'
    };
    return classes[status] || 'secondary';
}

function formatarStatus(status) {
    const formatos = {
        'preparo': 'Em Preparo',   // Mostra "Em Preparo" para pedidos abertos/vazios
        'pronto': 'Pronto',
        'entregue': 'Entregue',
        'cancelado': 'Cancelado'
    };
    return formatos[status] || status;
}

function formatarHorario(horario) {
    if (!horario) return '';
    const partes = horario.split(' ');
    return partes.length > 1 ? partes[1] : horario;
}

// ==================== FUNÇÕES QUE ESTAVAM FALTANDO ====================

async function visualizarPedido(pedidoId) {
    try {
        const pedido = pedidos.find(p => p.id === pedidoId);
        if (!pedido) {
            alert('Pedido não encontrado!');
            return;
        }

        console.log('Pedido encontrado:', pedido);

        // Verificar se já temos os itens no pedido
        let itens = pedido.itens || [];
        
        // Se não tiver itens, tentar buscar da API
        if (itens.length === 0) {
            try {
                const detalhes = await apiGet(`module=pedidos&action=detalhes&id=${pedidoId}`);
                if (detalhes.success && detalhes.itens) {
                    itens = detalhes.itens;
                }
            } catch (err) {
                console.warn('Não foi possível buscar itens da API:', err);
            }
        }

        // Formata os dados do pedido
        const endereco = pedido.cep ? {
            rua: pedido.rua || '',
            numero: pedido.numero_endereco || '',
            complemento: pedido.complemento || '',
            bairro: pedido.bairro || '',
            cidade: pedido.cidade || '',
            estado: pedido.estado || '',
            cep: pedido.cep || ''
        } : null;

        // Calcular totais
        const totalItens = itens.reduce((total, item) => {
            const subtotal = parseFloat(item.subtotal || (parseFloat(item.preco || item.preco_unitario || 0) * parseInt(item.quantidade || 1)));
            return total + subtotal;
        }, 0);
        
        const taxaEntrega = parseFloat(pedido.taxa_entrega || 0);
        const diferenca = parseFloat(pedido.total || 0) - totalItens - taxaEntrega;

        const modalHTML = `
            <div class="modal fade show" id="modal-pedido-detalhes" tabindex="-1" style="display: block; background: rgba(0,0,0,0.5); z-index: 1050; position: fixed; top: 0; left: 0; width: 100%; height: 100%; overflow: hidden;">
                <div class="modal-dialog modal-dialog-centered" style="max-width: 900px; margin: 0 auto; display: flex; align-items: center; justify-content: center; height: 100vh;">

                    <div class="modal-content" style="border-radius: 12px; overflow: hidden; border: none; box-shadow: 0 10px 30px rgba(0,0,0,0.2); width: 100%; max-height: 90vh; display: flex; flex-direction: column;">
                        <!-- Cabeçalho MODERNO -->
                        <div style="background: linear-gradient(135deg, #c1121f 0%, #a50e1a 100%); color: white; padding: 20px 25px; position: relative; flex-shrink: 0;">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 15px;">
                                <div>
                                    <h5 style="margin: 0 0 5px 0; font-weight: 700; font-size: 1.4rem; display: flex; align-items: center; gap: 10px;">
                                        <i class="fas fa-receipt" style="font-size: 1.2rem;"></i> 
                                        Pedido #${pedido.numero_pedido || pedido.id}
                                    </h5>
                                    <div style="display: flex; align-items: center; gap: 15px; flex-wrap: wrap;">
                                        <small style="opacity: 0.95; font-size: 0.9rem; background: rgba(255,255,255,0.15); padding: 3px 10px; border-radius: 20px;">
                                            <i class="far fa-calendar"></i> ${formatarDataBrasileira(pedido.data_pedido) || ''}
                                        </small>
                                        <small style="opacity: 0.95; font-size: 0.9rem; background: rgba(255,255,255,0.15); padding: 3px 10px; border-radius: 20px;">
                                            <i class="far fa-clock"></i> ${formatarHorarioSemSegundos(pedido.horario_pedido) || ''}
                                        </small>
                                    </div>
                                </div>
                                <span class="badge" style="background: ${getCorStatus(pedido.status)}; color: ${getCorTextoStatus(pedido.status)}; padding: 8px 16px; font-size: 0.95rem; font-weight: 600; border-radius: 20px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                                    ${formatarStatus(pedido.status)}
                                </span>
                            </div>
                        </div>

                        <!-- Corpo do Modal - Scrollable -->
                        <div style="flex: 1; overflow-y: auto; padding: 0; background: #f8fafc;">
                            <!-- Informações do Cliente -->
                            <div style="padding: 25px; border-bottom: 1px solid #e9ecef;">
                                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px;">
                                    <div style="background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.04); border: 1px solid #e9ecef;">
                                        <div style="color: #6c757d; font-size: 0.85rem; margin-bottom: 8px; font-weight: 600;">
                                            <i class="fas fa-user" style="margin-right: 8px;"></i>CLIENTE
                                        </div>
                                        <div style="font-weight: 700; font-size: 1.1rem; color: #343a40;">${pedido.nome_cliente || 'Não informado'}</div>
                                    </div>
                                    
                                    <div style="background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.04); border: 1px solid #e9ecef;">
                                        <div style="color: #6c757d; font-size: 0.85rem; margin-bottom: 8px; font-weight: 600;">
                                            <i class="fas fa-phone" style="margin-right: 8px;"></i>TELEFONE
                                        </div>
                                        <div style="font-weight: 600; color: #495057;">${pedido.telefone_cliente || pedido.telefone || 'Não informado'}</div>
                                    </div>
                                    
                                    <div style="background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.04); border: 1px solid #e9ecef;">
                                        <div style="color: #6c757d; font-size: 0.85rem; margin-bottom: 8px; font-weight: 600;">
                                            <i class="fas fa-tag" style="margin-right: 8px;"></i>TIPO
                                        </div>
                                        <div style="font-weight: 600; color: #495057;">${pedido.tipo || 'N/A'}</div>
                                    </div>
                                    
                                    <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); padding: 15px; border-radius: 8px; border: 1px solid #dee2e6;">
                                        <div style="color: #6c757d; font-size: 0.85rem; margin-bottom: 8px; font-weight: 600;">
                                            <i class="fas fa-receipt" style="margin-right: 8px;"></i>TOTAL
                                        </div>
                                        <div style="font-size: 1.4rem; font-weight: 800; color: #c1121f;">
                                            R$ ${parseFloat(pedido.total || 0).toFixed(2)}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Detalhes Adicionais -->
                            <div style="padding: 25px; border-bottom: 1px solid #e9ecef;">
                                ${pedido.tipo === 'Delivery' && endereco ? `
                                <div style="margin-bottom: 20px;">
                                    <div style="color: #6c757d; font-size: 0.9rem; margin-bottom: 10px; font-weight: 600; display: flex; align-items: center;">
                                        <i class="fas fa-map-marker-alt" style="margin-right: 10px; color: #c1121f;"></i>
                                        ENDEREÇO DE ENTREGA
                                    </div>
                                    <div style="background: white; padding: 18px; border-radius: 8px; border-left: 4px solid #c1121f; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
                                        <div style="font-weight: 600; margin-bottom: 5px; font-size: 1.05rem; color: #343a40;">
                                            ${endereco.rua}, ${endereco.numero}
                                        </div>
                                        ${endereco.complemento ? `
                                        <div style="color: #6c757d; margin-bottom: 5px;">
                                            <i class="fas fa-info-circle" style="margin-right: 5px;"></i>${endereco.complemento}
                                        </div>
                                        ` : ''}
                                        <div style="color: #495057;">
                                            ${endereco.bairro} • ${endereco.cidade}/${endereco.estado}
                                        </div>
                                        <div style="color: #6c757d; font-size: 0.9rem; margin-top: 8px;">
                                            <i class="fas fa-mail-bulk" style="margin-right: 5px;"></i>CEP: ${endereco.cep}
                                        </div>
                                    </div>
                                </div>
                                ` : pedido.tipo === 'Local' && pedido.mesa_numero ? `
                                <div style="margin-bottom: 20px;">
                                    <div style="color: #6c757d; font-size: 0.9rem; margin-bottom: 10px; font-weight: 600; display: flex; align-items: center;">
                                        <i class="fas fa-chair" style="margin-right: 10px; color: #28a745;"></i>
                                        MESA
                                    </div>
                                    <div style="background: white; padding: 18px; border-radius: 8px; border-left: 4px solid #28a745; box-shadow: 0 2px 8px rgba(0,0,0,0.06); text-align: center;">
                                        <div style="font-size: 2rem; font-weight: 800; color: #28a745; letter-spacing: 2px;">
                                            ${pedido.mesa_numero}
                                        </div>
                                        <div style="color: #6c757d; font-size: 0.9rem; margin-top: 5px;">
                                            Consumo no local
                                        </div>
                                    </div>
                                </div>
                                ` : ''}
                                
                                ${pedido.observacao ? `
                                <div>
                                    <div style="color: #6c757d; font-size: 0.9rem; margin-bottom: 10px; font-weight: 600; display: flex; align-items: center;">
                                        <i class="fas fa-sticky-note" style="margin-right: 10px; color: #ffc107;"></i>
                                        OBSERVAÇÕES
                                    </div>
                                    <div style="background: #fff8e1; padding: 18px; border-radius: 8px; border-left: 4px solid #ffc107; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
                                        <div style="color: #856404; line-height: 1.5;">
                                            <i class="fas fa-quote-left" style="opacity: 0.5; margin-right: 5px;"></i>
                                            ${pedido.observacao}
                                            <i class="fas fa-quote-right" style="opacity: 0.5; margin-left: 5px;"></i>
                                        </div>
                                    </div>
                                </div>
                                ` : ''}
                            </div>

                            <!-- Itens do Pedido -->
                            <div style="padding: 25px;">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                                    <div style="display: flex; align-items: center; gap: 10px;">
                                        <div style="background: #c1121f; color: white; padding: 5px 15px; border-radius: 20px; font-size: 0.9rem; font-weight: 600;">
                                            <i class="fas fa-shopping-basket" style="margin-right: 8px;"></i>
                                            ITENS DO PEDIDO
                                        </div>
                                        <div style="color: #6c757d; font-size: 0.9rem; font-weight: 600;">
                                            (${itens.length} ${itens.length === 1 ? 'item' : 'itens'})
                                        </div>
                                    </div>
                                </div>
                                
                                <div style="background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.08); border: 1px solid #e9ecef;">
                                    <!-- Cabeçalho da tabela -->
                                    <div style="background: #f8f9fa; padding: 15px 20px; border-bottom: 2px solid #dee2e6; display: grid; grid-template-columns: 3fr 1fr 1fr 1fr; gap: 15px; font-weight: 600; color: #495057; font-size: 0.9rem;">
                                        <div>PRODUTO</div>
                                        <div style="text-align: center;">QTD</div>
                                        <div style="text-align: right;">UNITÁRIO</div>
                                        <div style="text-align: right;">SUBTOTAL</div>
                                    </div>
                                    
                                    <!-- Lista de itens -->
                                    <div style="max-height: 300px; overflow-y: auto;">
                                        ${itens.length > 0 ? itens.map((item, index) => {
                                            const nomeItem = item.nome || item.item_nome || 'Item';
                                            const preco = parseFloat(item.preco || item.preco_unitario || 0);
                                            const quantidade = parseInt(item.quantidade || 1);
                                            const subtotal = parseFloat(item.subtotal || (preco * quantidade));
                                            
                                            return `
                                            <div style="padding: 15px 20px; border-bottom: 1px solid #f0f0f0; background: ${index % 2 === 0 ? '#fff' : '#f8fafc'}; display: grid; grid-template-columns: 3fr 1fr 1fr 1fr; gap: 15px; align-items: center;">
                                                <div>
                                                    <div style="font-weight: 600; color: #343a40;">${nomeItem}</div>
                                                    ${item.observacoes ? `
                                                    <div style="font-size: 0.85rem; color: #6c757d; margin-top: 5px;">
                                                        <i class="fas fa-info-circle" style="margin-right: 5px;"></i>${item.observacoes}
                                                    </div>
                                                    ` : ''}
                                                </div>
                                                <div style="text-align: center;">
                                                    <span style="background: #e9ecef; color: #495057; padding: 5px 12px; border-radius: 20px; font-size: 0.9rem; font-weight: 600; display: inline-block; min-width: 50px;">
                                                        ${quantidade}x
                                                    </span>
                                                </div>
                                                <div style="text-align: right; font-weight: 600; color: #495057;">
                                                    R$ ${preco.toFixed(2)}
                                                </div>
                                                <div style="text-align: right; font-weight: 700; color: #c1121f;">
                                                    R$ ${subtotal.toFixed(2)}
                                                </div>
                                            </div>
                                            `;
                                        }).join('') : `
                                        <div style="padding: 40px 20px; text-align: center; color: #adb5bd;">
                                            <i class="fas fa-shopping-basket" style="font-size: 48px; opacity: 0.3; margin-bottom: 15px;"></i>
                                            <div style="font-size: 1.1rem; font-weight: 600; margin-bottom: 5px;">Nenhum item registrado</div>
                                            <div style="font-size: 0.9rem;">Este pedido não contém itens</div>
                                        </div>
                                        `}
                                    </div>
                                    
                                    <!-- Total dos itens -->
                                    <div style="padding: 15px 20px; background: #f8f9fa; border-top: 2px solid #dee2e6; display: flex; justify-content: space-between; align-items: center;">
                                        <div style="font-weight: 600; color: #495057; font-size: 1rem;">Total dos itens:</div>
                                        <div style="font-weight: 700; color: #c1121f; font-size: 1.1rem;">R$ ${totalItens.toFixed(2)}</div>
                                    </div>
                                </div>
                            </div>

                            <!-- Resumo Financeiro -->
                            <div style="padding: 25px; background: white; border-top: 1px solid #e9ecef;">
                                <div style="margin-bottom: 25px;">
                                    <div style="color: #6c757d; font-size: 0.9rem; margin-bottom: 15px; font-weight: 600; display: flex; align-items: center;">
                                        <i class="fas fa-calculator" style="margin-right: 10px; color: #6c757d;"></i>
                                        RESUMO DO PAGAMENTO
                                    </div>
                                    
                                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 15px; margin-bottom: 20px;">
                                        ${taxaEntrega > 0 ? `
                                        <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); padding: 12px; border-radius: 8px; border: 1px solid #dee2e6; text-align: center;">
                                            <div style="font-size: 0.8rem; color: #6c757d; margin-bottom: 5px; font-weight: 600;">Taxa de entrega</div>
                                            <div style="font-weight: 700; color: #495057; font-size: 1.1rem;">R$ ${taxaEntrega.toFixed(2)}</div>
                                        </div>
                                        ` : ''}
                                        
                                        ${diferenca !== 0 ? `
                                        <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); padding: 12px; border-radius: 8px; border: 1px solid #dee2e6; text-align: center;">
                                            <div style="font-size: 0.8rem; color: #6c757d; margin-bottom: 5px; font-weight: 600;">Outros ajustes</div>
                                            <div style="font-weight: 700; color: ${diferenca > 0 ? '#28a745' : '#dc3545'}; font-size: 1.1rem;">
                                                ${diferenca > 0 ? '+' : ''}R$ ${diferenca.toFixed(2)}
                                            </div>
                                        </div>
                                        ` : ''}
                                        
                                        ${pedido.forma_pagamento ? `
                                        <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); padding: 12px; border-radius: 8px; border: 1px solid #dee2e6; text-align: center;">
                                            <div style="font-size: 0.8rem; color: #6c757d; margin-bottom: 5px; font-weight: 600;">Forma de pagamento</div>
                                            <div style="font-weight: 700; color: #495057; font-size: 1rem;">
                                                ${formatarFormaPagamento(pedido.forma_pagamento)}
                                            </div>
                                        </div>
                                        ` : ''}
                                        
                                        ${pedido.forma_pagamento === 'dinheiro' && pedido.troco_para ? `
                                        <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); padding: 12px; border-radius: 8px; border: 1px solid #dee2e6; text-align: center;">
                                            <div style="font-size: 0.8rem; color: #6c757d; margin-bottom: 5px; font-weight: 600;">Troco para</div>
                                            <div style="font-weight: 700; color: #28a745; font-size: 1.1rem;">R$ ${parseFloat(pedido.troco_para).toFixed(2)}</div>
                                        </div>
                                        ` : ''}
                                    </div>
                                </div>
                                
                                <!-- Total Final -->
                                <div style="background: linear-gradient(135deg, #c1121f 0%, #a50e1a 100%); color: white; padding: 25px; border-radius: 10px; text-align: center; box-shadow: 0 5px 15px rgba(193, 18, 31, 0.2); position: relative; overflow: hidden;">
                                    <div style="position: absolute; top: 0; right: 0; width: 100px; height: 100px; background: rgba(255,255,255,0.1); border-radius: 50%; transform: translate(30px, -30px);"></div>
                                    <div style="position: absolute; bottom: 0; left: 0; width: 80px; height: 80px; background: rgba(255,255,255,0.1); border-radius: 50%; transform: translate(-30px, 30px);"></div>
                                    
                                    <div style="position: relative; z-index: 1;">
                                        <div style="font-size: 0.9rem; opacity: 0.9; margin-bottom: 5px; font-weight: 600; letter-spacing: 1px;">
                                            VALOR TOTAL DO PEDIDO
                                        </div>
                                        <div style="font-size: 2.2rem; font-weight: 800; margin: 10px 0; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                                            R$ ${parseFloat(pedido.total || 0).toFixed(2)}
                                        </div>
                                        ${pedido.forma_pagamento === 'dinheiro' && pedido.troco_para && parseFloat(pedido.troco_para) > parseFloat(pedido.total || 0) ? `
                                        <div style="background: rgba(255,255,255,0.2); padding: 8px 20px; border-radius: 20px; display: inline-block; margin-top: 10px; font-weight: 600; font-size: 0.95rem;">
                                            <i class="fas fa-exchange-alt" style="margin-right: 8px;"></i>
                                            Troco: R$ ${(parseFloat(pedido.troco_para) - parseFloat(pedido.total || 0)).toFixed(2)}
                                        </div>
                                        ` : ''}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Rodapé FIXO -->
                        <div style="padding: 20px 25px; border-top: 1px solid #e9ecef; background: white; display: flex; justify-content: space-between; align-items: center; flex-shrink: 0;">
                            <div style="color: #6c757d; font-size: 0.85rem; display: flex; align-items: center; gap: 10px;">
                                <i class="fas fa-info-circle"></i>
                                Pedido processado em ${new Date().toLocaleDateString('pt-BR')}
                            </div>
                            <div style="display: flex; gap: 10px;">
                                <button onclick="fecharModalPedido()" 
                                        style="background: #6c757d; color: white; border: none; padding: 10px 25px; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 0.95rem; transition: all 0.3s; display: flex; align-items: center; gap: 8px;"
                                        onmouseover="this.style.background='#5a6268'"
                                        onmouseout="this.style.background='#6c757d'">
                                    <i class="fas fa-times"></i> Fechar
                                </button>
                                <button onclick="imprimirPedido(${pedidoId})"
                                        style="background: linear-gradient(135deg, #c1121f 0%, #a50e1a 100%); color: white; border: none; padding: 10px 25px; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 0.95rem; transition: all 0.3s; display: flex; align-items: center; gap: 8px; box-shadow: 0 3px 10px rgba(193, 18, 31, 0.3);"
                                        onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 5px 15px rgba(193, 18, 31, 0.4)'"
                                        onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 3px 10px rgba(193, 18, 31, 0.3)'">
                                    <i class="fas fa-print"></i> Imprimir Pedido
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remover modal anterior se existir
        const modalAnterior = document.getElementById('modal-pedido-detalhes');
        if (modalAnterior) modalAnterior.remove();

        // Adicionar novo modal
        document.body.insertAdjacentHTML('beforeend', modalHTML);

    } catch (err) {
        console.error('Erro ao visualizar pedido:', err);
        alert('Erro ao carregar detalhes do pedido');
    }
}

function fecharModalPedido() {
    const modal = document.getElementById('modal-pedido-detalhes');
    if (modal) modal.remove();
}

function imprimirPedido(pedidoId) {
    const pedido = pedidos.find(p => p.id === pedidoId);
    if (!pedido) {
        alert('Pedido não encontrado!');
        return;
    }

    // Criar modal para escolher o tipo de impressão
    const modalImpressaoHTML = `
        <div class="modal fade show" id="modal-escolher-impressao" tabindex="-1" style="display: block; background: rgba(0,0,0,0.5);">
           <div class="modal-dialog modal-sm modal-dialog-centered" style="min-height: 100vh; display: flex; align-items: center; justify-content: center; margin: 0 auto;">
           <div class="modal-content">
                    <div class="modal-header" style="background: var(--vermelho, #c1121f); color: white;">
                        <h5 class="modal-title">
                            <i class="fas fa-print"></i> Escolher Tipo de Impressão
                        </h5>
                        <button type="button" class="close" onclick="fecharModalImpressao()" style="color: white;">
                            <span>&times;</span>
                        </button>
                    </div>
                    <div class="modal-body text-center">
                        <h6>Pedido: ${pedido.numero_pedido || '#' + pedido.id}</h6>
                        <p class="text-muted mb-4">Selecione o formato desejado:</p>
                        
                        <div class="d-flex flex-column gap-3">
                            <button class="btn btn-outline-primary btn-lg" onclick="imprimirComprovanteNormal(${pedidoId})">
                                <i class="fas fa-file-alt"></i> Comprovante Normal (A4)
                            </button>
                            
                            <button class="btn btn-outline-success btn-lg" onclick="imprimirComprovanteTermico(${pedidoId})">
                                <i class="fas fa-receipt"></i> Comprovante Térmico (58mm)
                            </button>
                        </div>
                        
                        <div class="mt-4 text-left" style="font-size: 12px; color: #666;">
                            <p><strong>Comprovante Normal:</strong> Para arquivo ou impressão em papel A4.</p>
                            <p><strong>Comprovante Térmico:</strong> Para impressão em máquinas de 58mm (caixas).</p>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick="fecharModalImpressao()">
                            <i class="fas fa-times"></i> Cancelar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Remover modal anterior se existir
    const modalAnterior = document.getElementById('modal-escolher-impressao');
    if (modalAnterior) modalAnterior.remove();

    // Adicionar novo modal
    document.body.insertAdjacentHTML('beforeend', modalImpressaoHTML);
}

// Função para fechar o modal de escolha
function fecharModalImpressao() {
    const modal = document.getElementById('modal-escolher-impressao');
    if (modal) modal.remove();
}

// ==================== COMPROVANTE TÉRMICO 58MM ====================
function imprimirComprovanteTermico(pedidoId) {
    const pedido = pedidos.find(p => p.id === pedidoId);
    if (!pedido) return;
    
    fecharModalImpressao(); // Fecha o modal de escolha
    
    // Buscar itens do pedido
    let itens = pedido.itens || [];
    
    // Formatar endereço se for delivery
    let enderecoTexto = '';
    if (pedido.tipo === 'Delivery' && (pedido.rua || pedido.cep)) {
        enderecoTexto = `
ENDEREÇO DE ENTREGA
${pedido.rua || ''}, ${pedido.numero_endereco || ''}
${pedido.complemento ? 'Comp: ' + pedido.complemento : ''}
${pedido.bairro || ''}
${pedido.cidade || ''} - ${pedido.estado || ''}
CEP: ${pedido.cep || ''}
`;
    }

    // Formatar mesa se for local
    let mesaTexto = '';
    if (pedido.tipo === 'Local' && pedido.mesa_numero) {
        mesaTexto = `
MESA: ${pedido.mesa_numero}
`;
    }

    // Formatar observações
    let obsTexto = '';
    if (pedido.observacao) {
        // Quebrar observações longas
        const obs = pedido.observacao;
        const obsLinhas = obs.length > 30 ? obs.match(/.{1,30}/g) : [obs];
        obsTexto = `
OBSERVAÇÕES
${obsLinhas.join('\n')}
`;
    }

    // Formatar itens - FORMATO LIMPO E ORGANIZADO
    let itensTexto = '';
    let totalItens = 0;
    if (itens.length > 0) {
        itensTexto = `
ITENS DO PEDIDO
`;
        
        itens.forEach((item, index) => {
            const nomeItem = item.nome || item.item_nome || 'Item';
            const preco = parseFloat(item.preco || item.preco_unitario || 0);
            const quantidade = parseInt(item.quantidade || 1);
            const subtotal = parseFloat(item.subtotal || (preco * quantidade));
            
            // Truncar nome se muito longo e adicionar reticências
            let nomeTruncado = nomeItem;
            if (nomeItem.length > 24) {
                nomeTruncado = nomeItem.substring(0, 22) + '..';
            }
            
            // Formatar quantidade (máx 2 dígitos)
            const qtdFormatada = quantidade.toString().padStart(2);
            
            // Formatar preço unitário
            const precoFormatado = `R$ ${preco.toFixed(2).padStart(7)}`;
            
            // Adicionar item formatado
            itensTexto += `${qtdFormatada}x ${nomeTruncado.padEnd(25)}${precoFormatado}\n`;
            itensTexto += `    ${(preco * quantidade).toFixed(2).padStart(31)}\n`;
            
            totalItens += subtotal;
        });
    }

    // Formatar data e hora
    const dataAtual = new Date();
    const dataFormatada = dataAtual.toLocaleDateString('pt-BR');
    const horaFormatada = dataAtual.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    const statusFormatado = formatarStatus(pedido.status);
    const horarioPedido = formatarHorario(pedido.horario_pedido);
    
    // Forma de pagamento
    const formaPagamento = pedido.forma_pagamento ? formatarFormaPagamento(pedido.forma_pagamento) : 'NÃO INFORMADO';

    // Calcular troco se for dinheiro
    let trocoTexto = '';
    if (pedido.forma_pagamento === 'dinheiro' && pedido.troco_para) {
        const troco = parseFloat(pedido.troco_para) - parseFloat(pedido.total || 0);
        if (troco > 0) {
            trocoTexto = `
TROCO PARA: R$ ${parseFloat(pedido.troco_para).toFixed(2)}
TROCO:      R$ ${troco.toFixed(2)}
`;
        }
    }

    // Formatar taxa de entrega se houver
    let taxaTexto = '';
    if (pedido.taxa_entrega && parseFloat(pedido.taxa_entrega) > 0) {
        taxaTexto = `TAXA ENTREGA: R$ ${parseFloat(pedido.taxa_entrega).toFixed(2)}\n`;
    }

    // Construir o conteúdo do comprovante térmico - FORMATO LIMPO
    const conteudoTermico = `
        BURGER SYSTEM
     ${'-'.repeat(28)}
        COMPROVANTE DE PEDIDO
     ${'-'.repeat(28)}

PEDIDO:   ${pedido.numero_pedido || '#' + pedido.id}
DATA:     ${pedido.data_pedido || dataFormatada}
HORA:     ${horarioPedido || horaFormatada}
STATUS:   ${statusFormatado}

CLIENTE:  ${pedido.nome_cliente || ''}
TELEFONE: ${pedido.telefone_cliente || pedido.telefone || ''}
TIPO:     ${pedido.tipo || ''}
${mesaTexto}${enderecoTexto}${obsTexto}
${itensTexto}
     ${'-'.repeat(28)}
TOTAL ITENS: ${itens.length}
${taxaTexto}
     ${'-'.repeat(28)}
TOTAL:    R$ ${parseFloat(pedido.total || 0).toFixed(2)}
     ${'-'.repeat(28)}

PGTO:     ${formaPagamento}
${trocoTexto}
     ${'-'.repeat(28)}

ATENDENTE: ${pedido.funcionario_nome || 'SISTEMA'}
EMISSÃO:  ${dataFormatada} ${horaFormatada}

     OBRIGADO PELA PREFERÊNCIA
         Volte sempre!

${'\n'.repeat(3)}`; // Espaço para cortar o papel

    // Abrir janela para impressão térmica
    abrirJanelaImpressaoTermica(conteudoTermico, pedido.numero_pedido || '#' + pedido.id);
}

// ==================== JANELA DE IMPRESSÃO TÉRMICA ====================
function abrirJanelaImpressaoTermica(conteudo, numeroPedido) {
    const htmlTermico = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Impressão Térmica - Pedido ${numeroPedido}</title>
    <style>
        @media print {
            @page { 
                size: 58mm auto; 
                margin: 0; 
                padding: 0;
            }
            body { 
                width: 58mm !important;
                max-width: 58mm !important;
                margin: 0 auto !important;
                padding: 1mm 2mm !important;
                font-family: 'Courier New', Courier, monospace !important;
                font-size: 8px !important;
                line-height: 1.1 !important;
                white-space: pre !important;
                word-wrap: break-word !important;
                overflow-wrap: break-word !important;
            }
            .no-print { display: none !important; }
            .print-only { display: block !important; }
        }
        
        body {
            font-family: 'Courier New', Courier, monospace;
            font-size: 8px;
            line-height: 1.1;
            width: 58mm;
            max-width: 58mm;
            margin: 0 auto;
            padding: 1mm 2mm;
            background: white;
            color: black;
            white-space: pre;
            word-wrap: break-word;
            overflow-wrap: break-word;
        }
        
        .preview-container {
            width: 100%;
            text-align: center;
        }
        
        .preview-label {
            font-size: 12px;
            color: #666;
            margin-bottom: 10px;
        }
        
        .preview-content {
            font-family: 'Courier New', Courier, monospace;
            font-size: 8px;
            line-height: 1.1;
            white-space: pre;
            text-align: left;
            border: 1px dashed #ccc;
            padding: 10px;
            margin: 0 auto;
            background: #f9f9f9;
            width: 58mm;
            min-height: 300px;
            overflow: auto;
        }
        
        .btn-imprimir {
            background: #28a745;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            margin: 10px 5px;
        }
        
        .btn-fechar {
            background: #dc3545;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            margin: 10px 5px;
        }
        
        .dicas {
            margin-top: 20px;
            padding: 10px;
            background: #f8f9fa;
            border-radius: 5px;
            font-size: 12px;
            color: #666;
        }
        
        .print-content {
            display: none;
        }
        
        @media print {
            .print-content {
                display: block;
            }
        }
    </style>
</head>
<body>
    <div class="no-print">
        <div class="preview-container">
            <h3 style="color: #333; margin-bottom: 5px;">Pré-visualização - Impressão Térmica</h3>
            <p class="preview-label">Pedido: ${numeroPedido} | Largura: 58mm</p>
            
            <div class="preview-content">
${conteudo}
            </div>
            
            <div style="margin-top: 20px;">
                <button class="btn-imprimir" onclick="imprimirAgora()">
                    🖨️ Imprimir Agora
                </button>
                <button class="btn-fechar" onclick="window.close()">
                    ✖️ Fechar Janela
                </button>
            </div>
            
            <div class="dicas">
                <p><strong>Dicas para impressão perfeita:</strong></p>
                <p>✓ Use papel térmico de 58mm de largura</p>
                <p>✓ Configure a impressora para 58mm de largura</p>
                <p>✓ Use fonte Courier New ou similar monoespaçada</p>
                <p>✓ Tamanho da fonte: 8px</p>
                <p>✓ Margens: 0mm (configuração @page no CSS)</p>
            </div>
        </div>
    </div>
    
    <div class="print-content">
${conteudo}
    </div>
    
    <script>
        function imprimirAgora() {
            window.print();
        }
        
        // Auto-impressão após 1 segundo
        setTimeout(() => {
            window.print();
        }, 1000);
        
        // Opção para fechar após impressão
        window.addEventListener('afterprint', function() {
            setTimeout(() => {
                if (confirm('Deseja fechar a janela de impressão?')) {
                    window.close();
                }
            }, 1000);
        });
        
        // Configurar CSS específico para impressão
        const printStyle = document.createElement('style');
        printStyle.textContent = \`
            @media print {
                @page { 
                    size: 58mm auto; 
                    margin: 0mm; 
                    padding: 0mm;
                }
                body { 
                    width: 58mm !important;
                    max-width: 58mm !important;
                    margin: 0 auto !important;
                    padding: 1mm 2mm !important;
                    font-family: 'Courier New', Courier, monospace !important;
                    font-size: 8px !important;
                    line-height: 1.1 !important;
                    white-space: pre !important;
                    word-wrap: break-word !important;
                    overflow-wrap: break-word !important;
                }
                .no-print { 
                    display: none !important; 
                }
                .print-content { 
                    display: block !important; 
                }
            }
        \`;
        document.head.appendChild(printStyle);
    </script>
</body>
</html>`;

    const largura = 650;
    const altura = 800;
    const left = (screen.width - largura) / 2;
    const top = (screen.height - altura) / 2;
    const janelaTermica = window.open(
    '',
    '_blank',
    `width=${largura},height=${altura},left=${left},top=${top}`
);

    janelaTermica.document.write(htmlTermico);
    janelaTermica.document.close();
    janelaTermica.focus();
}

// ==================== COMPROVANTE NORMAL (A4) ====================
function imprimirComprovanteNormal(pedidoId) {
    const pedido = pedidos.find(p => p.id === pedidoId);
    if (!pedido) return;
    
    fecharModalImpressao(); // Fecha o modal de escolha
    
    // Buscar itens do pedido
    let itens = pedido.itens || [];
    
    // Formatar endereço se for delivery
    let enderecoHTML = '';
    if (pedido.tipo === 'Delivery' && (pedido.rua || pedido.cep)) {
        enderecoHTML = `
            <div style="margin: 15px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; background-color: #f8f9fa;">
                <h4 style="margin: 0 0 10px 0; color: #c1121f; border-bottom: 1px solid #c1121f; padding-bottom: 5px;">Endereço de Entrega</h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <div>
                        <p style="margin: 5px 0;"><strong>Rua:</strong> ${pedido.rua || ''}</p>
                        <p style="margin: 5px 0;"><strong>Número:</strong> ${pedido.numero_endereco || ''}</p>
                        ${pedido.complemento ? `<p style="margin: 5px 0;"><strong>Complemento:</strong> ${pedido.complemento}</p>` : ''}
                    </div>
                    <div>
                        <p style="margin: 5px 0;"><strong>Bairro:</strong> ${pedido.bairro || ''}</p>
                        <p style="margin: 5px 0;"><strong>Cidade:</strong> ${pedido.cidade || ''} - ${pedido.estado || ''}</p>
                        <p style="margin: 5px 0;"><strong>CEP:</strong> ${pedido.cep || ''}</p>
                    </div>
                </div>
            </div>
        `;
    }

    // Formatar mesa se for local
    let mesaHTML = '';
    if (pedido.tipo === 'Local' && pedido.mesa_numero) {
        mesaHTML = `
            <div style="margin: 15px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; background-color: #f8f9fa;">
                <h4 style="margin: 0 0 10px 0; color: #c1121f; border-bottom: 1px solid #c1121f; padding-bottom: 5px;">Mesa</h4>
                <p style="margin: 5px 0; font-size: 18px; text-align: center;"><strong>Número:</strong> ${pedido.mesa_numero}</p>
            </div>
        `;
    }

    // Formatar observações se houver
    let observacaoHTML = '';
    if (pedido.observacao) {
        observacaoHTML = `
            <div style="margin: 15px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; background-color: #f8f9fa;">
                <h4 style="margin: 0 0 10px 0; color: #c1121f; border-bottom: 1px solid #c1121f; padding-bottom: 5px;">Observações</h4>
                <p style="margin: 5px 0;">${pedido.observacao}</p>
            </div>
        `;
    }

    // Formatar tabela de itens
    let itensHTML = '';
    if (itens.length > 0) {
        const itensRows = itens.map(item => {
            const nomeItem = item.nome || item.item_nome || 'Item';
            const preco = parseFloat(item.preco || item.preco_unitario || 0);
            const quantidade = parseInt(item.quantidade || 1);
            const subtotal = parseFloat(item.subtotal || (preco * quantidade));
            
            return `
                <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #eee;">${nomeItem}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${quantidade}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">R$ ${preco.toFixed(2)}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">R$ ${subtotal.toFixed(2)}</td>
                </tr>
            `;
        }).join('');

        itensHTML = `
            <div style="margin: 20px 0;">
                <h4 style="margin: 0 0 15px 0; color: #c1121f; border-bottom: 2px solid #c1121f; padding-bottom: 5px;">Itens do Pedido (${itens.length})</h4>
                <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                    <thead>
                        <tr style="background-color: #f8f9fa;">
                            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6;">Item</th>
                            <th style="padding: 12px; text-align: center; border-bottom: 2px solid #dee2e6;">Qtd</th>
                            <th style="padding: 12px; text-align: right; border-bottom: 2px solid #dee2e6;">Preço Unit.</th>
                            <th style="padding: 12px; text-align: right; border-bottom: 2px solid #dee2e6;">Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itensRows}
                    </tbody>
                </table>
            </div>
        `;
    } else {
        itensHTML = `
            <div style="margin: 20px 0; padding: 15px; background-color: #f8f9fa; border-radius: 5px; border: 1px solid #ddd;">
                <p style="margin: 0; text-align: center; color: #6c757d;">Nenhum item registrado</p>
            </div>
        `;
    }

    // Formatar informações básicas
    const statusFormatado = formatarStatus(pedido.status);
    const horarioFormatado = formatarHorario(pedido.horario_pedido);
    
    // Forma de pagamento (se disponível)
    const formaPagamento = pedido.forma_pagamento ? formatarFormaPagamento(pedido.forma_pagamento) : 'Não informado';

    // Calcular troco se for dinheiro
    let trocoHTML = '';
    if (pedido.forma_pagamento === 'dinheiro' && pedido.troco_para) {
        const troco = parseFloat(pedido.troco_para) - parseFloat(pedido.total || 0);
        if (troco > 0) {
            trocoHTML = `
                <div style="margin-top: 10px; padding: 10px; background-color: #e8f5e8; border-radius: 5px; border: 1px solid #28a745;">
                    <p style="margin: 0; color: #155724;">
                        <strong>Pagamento em dinheiro:</strong><br>
                        <span style="font-size: 16px;">Troco para R$ ${parseFloat(pedido.troco_para).toFixed(2)}</span><br>
                        <span style="font-size: 18px; font-weight: bold;">Troco: R$ ${troco.toFixed(2)}</span>
                    </p>
                </div>
            `;
        }
    }

    const conteudoNormal = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Comprovante do Pedido ${pedido.numero_pedido || '#' + pedido.id}</title>
    <style>
        @media print {
            body { margin: 0; padding: 15px; }
            .no-print { display: none !important; }
            .page-break { page-break-before: always; }
        }
        body {
            font-family: 'Arial', sans-serif;
            margin: 0;
            padding: 20px;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
        }
        .header {
            text-align: center;
            border-bottom: 3px solid #c1121f;
            padding-bottom: 15px;
            margin-bottom: 20px;
        }
        .header h1 {
            color: #c1121f;
            margin: 0 0 5px 0;
            font-size: 24px;
        }
        .header .numero-pedido {
            font-size: 22px;
            font-weight: bold;
            color: #333;
            margin: 10px 0;
        }
        .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
        }
        .info-box {
            padding: 15px;
            border: 1px solid #dee2e6;
            border-radius: 5px;
            background-color: #f8f9fa;
        }
        .info-box h3 {
            margin-top: 0;
            color: #c1121f;
            border-bottom: 1px solid #dee2e6;
            padding-bottom: 5px;
        }
        .info-row {
            display: flex;
            margin-bottom: 8px;
        }
        .info-label {
            font-weight: bold;
            min-width: 120px;
            color: #555;
        }
        .info-value {
            flex: 1;
        }
        .badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
        }
        .badge-warning { background-color: #ffc107; color: #856404; }
        .badge-info { background-color: #17a2b8; color: white; }
        .badge-success { background-color: #28a745; color: white; }
        .badge-danger { background-color: #dc3545; color: white; }
        .badge-secondary { background-color: #6c757d; color: white; }
        .total-box {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 5px;
            text-align: center;
            margin-top: 20px;
            border: 2px solid #c1121f;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 15px;
            border-top: 1px solid #dee2e6;
            color: #6c757d;
            font-size: 12px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0;
        }
        th {
            background-color: #f8f9fa;
            padding: 12px;
            text-align: left;
            border-bottom: 2px solid #dee2e6;
        }
        td {
            padding: 10px;
            border-bottom: 1px solid #eee;
        }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .text-bold { font-weight: bold; }
        .valor-total {
            font-size: 28px;
            color: #c1121f;
            font-weight: bold;
            margin: 10px 0;
        }
        .detalhes-pagamento {
            margin-top: 15px;
            padding-top: 15px;
            border-top: 1px dashed #ddd;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>COMPROVANTE DO PEDIDO</h1>
        <div class="numero-pedido">${pedido.numero_pedido || '#' + pedido.id}</div>
        <p style="color: #666; font-size: 14px;">BurgerSystem - Sistema de Gestão</p>
    </div>

    <div class="info-grid">
        <div class="info-box">
            <h3>Informações do Pedido</h3>
            <div class="info-row">
                <div class="info-label">Número:</div>
                <div class="info-value text-bold">${pedido.numero_pedido || '#' + pedido.id}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Cliente:</div>
                <div class="info-value">${pedido.nome_cliente || 'N/A'}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Telefone:</div>
                <div class="info-value">${pedido.telefone_cliente || pedido.telefone || 'N/A'}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Tipo:</div>
                <div class="info-value">${pedido.tipo || 'N/A'}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Status:</div>
                <div class="info-value">
                    <span class="badge badge-${getClasseStatus(pedido.status)}">
                        ${statusFormatado}
                    </span>
                </div>
            </div>
            <div class="info-row">
                <div class="info-label">Data:</div>
                <div class="info-value">${pedido.data_pedido || ''}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Horário:</div>
                <div class="info-value">${horarioFormatado}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Pagamento:</div>
                <div class="info-value">${formaPagamento}</div>
            </div>
            ${pedido.taxa_entrega ? `
            <div class="info-row">
                <div class="info-label">Taxa de Entrega:</div>
                <div class="info-value">R$ ${parseFloat(pedido.taxa_entrega || 0).toFixed(2)}</div>
            </div>
            ` : ''}
        </div>
    </div>

    ${enderecoHTML}
    ${mesaHTML}
    ${observacaoHTML}

    ${itensHTML}

    <div class="total-box">
        <div style="font-size: 18px; color: #666;">
            VALOR TOTAL DO PEDIDO
        </div>
        <div class="valor-total">
            R$ ${parseFloat(pedido.total || 0).toFixed(2)}
        </div>
        
        ${trocoHTML}
        
        <div class="detalhes-pagamento">
            <p style="margin: 5px 0; color: #666;">
                <strong>Forma de pagamento:</strong> ${formaPagamento}
            </p>
            ${pedido.forma_pagamento === 'dinheiro' && pedido.troco_para ? `
            <p style="margin: 5px 0; color: #666;">
                <strong>Recebido:</strong> R$ ${parseFloat(pedido.troco_para).toFixed(2)}
            </p>
            ` : ''}
        </div>
    </div>

    <div class="footer">
        <p>Pedido gerado em ${new Date().toLocaleString('pt-BR')}</p>
        <p>BurgerSystem &copy; ${new Date().getFullYear()} - Sistema de Gestão para Lanchonetes</p>
        <p style="font-size: 10px; color: #999;">
            Este é um comprovante gerado automaticamente pelo sistema.
            Em caso de dúvidas, entre em contato com o estabelecimento.
        </p>
    </div>

    <div class="no-print" style="text-align: center; margin-top: 20px; padding: 20px; border-top: 1px solid #ddd;">
        <button onclick="window.print()" style="
            background-color: #c1121f;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            margin: 5px;
            font-weight: bold;
        ">
            🖨️ Imprimir Comprovante
        </button>
        <button onclick="window.close()" style="
            background-color: #6c757d;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            margin: 5px;
        ">
            ✖️ Fechar Janela
        </button>
    </div>

    <script>
        // Auto-print após 500ms
        setTimeout(() => {
            window.print();
        }, 500);
        
        // Fechar janela após impressão (se configurado)
        window.addEventListener('afterprint', function() {
            setTimeout(() => {
                if (confirm('Deseja fechar a janela de impressão?')) {
                    window.close();
                }
            }, 1000);
        });
    </script>
</body>
</html>`;

    const largura = 900;
    const altura = 700;
    const left = (screen.width - largura) / 2;
    const top = (screen.height - altura) / 2;
     const janelaNormal = window.open(
    '',
    '_blank',
    `width=${largura},height=${altura},left=${left},top=${top}`
    );

    janelaNormal.document.write(conteudoNormal);
    janelaNormal.document.close();
    janelaNormal.focus();
}


// Adicione esta função auxiliar se ainda não existir
function formatarFormaPagamento(forma) {
    const formatos = {
        'dinheiro': 'Dinheiro',
        'cartao_credito': 'Cartão de Crédito',
        'cartao_debito': 'Cartão de Débito',
        'pix': 'PIX',
        'outro': 'Outro'
    };
    return formatos[forma] || forma;
}
// ==================== FUNÇÕES AUXILIARES ====================

function getCorStatus(status) {
    const cores = {
        'preparo': '#ffc107',       // Amarelo
        'em_preparo': '#ffc107',    // Amarelo
        'pronto': '#17a2b8',        // Azul
        'entregue': '#28a745',      // Verde
        'cancelado': '#dc3545',     // Vermelho
        'todos': '#6c757d'          // Cinza
    };
    return cores[status] || '#6c757d';
}

function getCorTextoStatus(status) {
    if (status === 'preparo' || status === 'em_preparo') {
        return '#856404'; // Texto escuro para fundo amarelo
    }
    return '#ffffff'; // Texto branco para outras cores
}

function getClasseStatus(status) {
    const classes = {
        'preparo': 'warning',
        'em_preparo': 'warning',
        'pronto': 'info',
        'entregue': 'success',
        'cancelado': 'danger'
    };
    return classes[status] || 'secondary';
}

function formatarStatus(status) {
    const formatos = {
        'preparo': 'Em Preparo',
        'em_preparo': 'Em Preparo',
        'pronto': 'Pronto',
        'entregue': 'Entregue',
        'cancelado': 'Cancelado'
    };
    return formatos[status] || status;
}

function formatarHorario(horario) {
    if (!horario) return '';
    // Remove a parte da data se houver
    const partes = horario.split(' ');
    return partes.length > 1 ? partes[1] : horario;
}

// ==================== FUNÇÃO ADICIONAR PEDIDO À LISTA ATIVA ====================

function adicionarPedidoAListaAtiva(pedido) {
    console.log('Adicionando pedido à lista ativa:', pedido);
    
    // Converte status "aberto" para "preparo" no frontend
    const statusFrontend = (pedido.status === 'aberto' || 
                           pedido.status === '' || 
                           pedido.status === null || 
                           pedido.status === undefined || 
                           pedido.status === ' ') ? 'preparo' : pedido.status;
    
    // Adiciona o pedido ao array de pedidos se não existir
    const pedidoExistenteIndex = pedidos.findIndex(p => p.id === pedido.id);
    
    if (pedidoExistenteIndex === -1) {
        // Adiciona novo pedido no início (mais recente primeiro)
        pedidos.unshift({
            ...pedido,
            status: statusFrontend
        });
        console.log(`✅ Novo pedido adicionado: ${pedido.numero_pedido || '#' + pedido.id}`);
    } else {
        // Atualiza pedido existente
        pedidos[pedidoExistenteIndex] = {
            ...pedidos[pedidoExistenteIndex],
            ...pedido,
            status: statusFrontend
        };
        console.log(`✅ Pedido atualizado: ${pedido.numero_pedido || '#' + pedido.id}`);
    }
    
    // Atualiza a lista filtrada
    const filtroAtivo = document.querySelector('#filtros-status-pedidos .btn-filter.active');
    if (filtroAtivo) {
        const statusFiltro = filtroAtivo.dataset.status;
        if (statusFiltro === 'todos' || statusFiltro === statusFrontend) {
            filtrarPedidosPorStatus(statusFiltro);
        }
    } else {
        pedidosFiltrados = [...pedidos];
        atualizarListaPedidos();
    }
    
    // Atualiza estatísticas
    atualizarEstatisticasPedidos();
    atualizarFiltrosStatus();
}

function removerPedidoDaListaAtiva(pedidoId) {
    console.log('Removendo pedido da lista ativa:', pedidoId);
    
    const index = pedidos.findIndex(p => p.id === pedidoId);
    if (index !== -1) {
        pedidos.splice(index, 1);
        
        // Atualiza lista filtrada
        const filtroAtivo = document.querySelector('#filtros-status-pedidos .btn-filter.active');
        if (filtroAtivo) {
            filtrarPedidosPorStatus(filtroAtivo.dataset.status);
        } else {
            pedidosFiltrados = [...pedidos];
            atualizarListaPedidos();
        }
        
        // Atualiza estatísticas
        atualizarEstatisticasPedidos();
        atualizarFiltrosStatus();
    }
}

function atualizarPedidoNaListaAtiva(pedidoId, dadosAtualizados) {
    console.log('Atualizando pedido na lista ativa:', pedidoId, dadosAtualizados);
    
    const index = pedidos.findIndex(p => p.id === pedidoId);
    if (index !== -1) {
        // Converte status "aberto" para "preparo" no frontend
        if (dadosAtualizados.status) {
            dadosAtualizados.status = (dadosAtualizados.status === 'aberto' || 
                                      dadosAtualizados.status === '' || 
                                      dadosAtualizados.status === null || 
                                      dadosAtualizados.status === undefined || 
                                      dadosAtualizados.status === ' ') ? 'preparo' : dadosAtualizados.status;
        }
        
        pedidos[index] = {
            ...pedidos[index],
            ...dadosAtualizados
        };
        
        // Atualiza lista filtrada
        const filtroAtivo = document.querySelector('#filtros-status-pedidos .btn-filter.active');
        if (filtroAtivo) {
            filtrarPedidosPorStatus(filtroAtivo.dataset.status);
        } else {
            pedidosFiltrados = [...pedidos];
            atualizarListaPedidos();
        }
        
        // Atualiza estatísticas
        atualizarEstatisticasPedidos();
        atualizarFiltrosStatus();
    }
}

// ==================== EXPORTA FUNÇÕES ADICIONAIS ====================

// Mantenha as exportações existentes e adicione as novas
window.adicionarPedidoAListaAtiva = adicionarPedidoAListaAtiva;
window.removerPedidoDaListaAtiva = removerPedidoDaListaAtiva;
window.atualizarPedidoNaListaAtiva = atualizarPedidoNaListaAtiva;

// ==================== INICIALIZAÇÃO ====================

document.addEventListener('DOMContentLoaded', function() {
    // Carrega pedidos quando a página é acessada
    if (window.location.hash === '#pedidos' || document.getElementById('pedidos')) {
        setTimeout(() => {
            carregarPedidos();
        }, 500);
    }
    
    // Escuta mudanças de hash (para SPAs)
    window.addEventListener('hashchange', function() {
        if (window.location.hash === '#pedidos') {
            setTimeout(() => {
                carregarPedidos();
            }, 300);
        }
    });
});

// ==================== EXPORTA FUNÇÕES ====================
window.carregarPedidos = carregarPedidos;
window.filtrarPedidosPorStatus = filtrarPedidosPorStatus;
window.mudarStatusPedido = mudarStatusPedido;
window.visualizarPedido = visualizarPedido;
window.fecharModalPedido = fecharModalPedido;

//Fim da sessaão pedidos 

// =============================================================
// =============   SISTEMA DE NOVO PEDIDO COMPLETO   ===========
// =============================================================

// ==================== VALIDAÇÕES ====================
function validarNomeCompleto(input) {
    if (!isPaginaNovoPedido()) return;
    if (!input) return;
    input.value = input.value.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ\s]/g, "");
    const partes = input.value.trim().split(/\s+/).filter(Boolean);
    if (partes.length < 2) {
        input.setCustomValidity("Digite nome e sobrenome.");
    } else {
        input.setCustomValidity("");
    }
}

function formatarTelefoneCelular(input) {
    if (!isPaginaNovoPedido()) return;
    if (!input) return;
    let v = input.value.replace(/\D/g, '');
    if (v.length > 11) v = v.substring(0, 11);

    if (v.length <= 2) {
        input.value = v;
        return;
    }

    const ddd = v.substring(0, 2);
    const resto = v.substring(2);

    if (resto.length <= 4) {
        input.value = `(${ddd}) ${resto}`;
    } else if (resto.length <= 8) {
        input.value = `(${ddd}) ${resto.substring(0, resto.length - 4)}-${resto.substring(resto.length - 4)}`;
    } else {
        input.value = `(${ddd}) ${resto.substring(0, 5)}-${resto.substring(5, 9)}`;
    }
}

function preencherNumeroPedido() {
    if (!isPaginaNovoPedido()) return;
    const campoNumero = document.getElementById('pedido-numero');
    if (!campoNumero || typeof apiGet !== 'function') return;

    // Use endpoint correto
    apiGet('module=pedidos&action=gerar_numero')
        .then(res => {
            console.log('Resposta do próximo número:', res);

            // Verificar diferentes formatos de resposta
            let numero;

            if (Array.isArray(res) && res.length > 0) {
                // Se for array com objeto
                const item = res[0];
                numero = item.proximo_numero || item.numero || 1;
            } else if (res && typeof res === 'object') {
                // Se for objeto direto
                numero = res.proximo_numero || res.numero || 1;
            } else {
                // Valor padrão
                numero = 1;
            }

            campoNumero.value = `#${String(numero).padStart(4, '0')}`;
            campoNumero.readOnly = true;
        })
        .catch((err) => {
            console.error('Erro ao buscar número do pedido:', err);
            campoNumero.value = '#0001';
        });
}

//MUDANÇAS PEDIDOS
// ==================== DATA & HORÁRIO ====================
function preencherDataPedido() {
    if (!isPaginaNovoPedido()) return;
    const campo = document.getElementById('pedido-data');
    if (!campo) return;
    const hoje = new Date();
    campo.value =
        String(hoje.getDate()).padStart(2, '0') + "/" +
        String(hoje.getMonth() + 1).padStart(2, '0') + "/" +
        hoje.getFullYear();
    campo.readOnly = true;
}

function preencherHorarioPedido() {
    if (!isPaginaNovoPedido()) return;
    const campo = document.getElementById('pedido-horario');
    if (!campo) return;
    const agora = new Date();
    campo.value =
        String(agora.getHours()).padStart(2, '0') + ":" +
        String(agora.getMinutes()).padStart(2, '0');
    campo.readOnly = true;
}
//FIM MUDANÇAS PEDIDOS

// ==================== CAMPOS DINÂMICOS ====================
function atualizarCamposTipoPedido() {
    if (!isPaginaNovoPedido()) return;
    const tipoEl = document.getElementById("pedido-tipo");
    const box = document.getElementById("campos-dinamicos");
    if (!box || !tipoEl) return;

    const tipo = tipoEl.value;
    box.innerHTML = "";

    if (tipo === "Delivery") {
        box.innerHTML = `
            <div class="form-grid" style="grid-template-columns: 1fr 1fr;">
                <div class="form-group"><label>CEP</label>
                    <input id="cep" class="form-control" oninput="aplicarMascaraCEP(event)">
                </div>
                <div class="form-group"><label>Rua</label>
                    <input id="rua" class="form-control">
                </div>
                <div class="form-group"><label>Número</label>
                    <input id="numero-endereco" class="form-control">
                </div>
                <div class="form-group"><label>Complemento</label>
                    <input id="complemento" class="form-control">
                </div>
                <div class="form-group"><label>Bairro</label>
                    <input id="bairro" class="form-control">
                </div>
                <div class="form-group"><label>Cidade</label>
                    <input id="cidade" class="form-control">
                </div>
                <div class="form-group"><label>Estado</label>
                    <input id="estado" class="form-control">
                </div>
            </div>
        `;
    } else if (tipo === "Local") {
        box.innerHTML = `
            <div class="form-group">
                <label>Número da Mesa</label>
                <input type="number" id="numero-mesa" class="form-control">
            </div>
        `;
    }
}

// ==================== CEP AUTO ====================
function aplicarMascaraCEP(event) {
    if (!isPaginaNovoPedido()) return;
    if (!event || !event.target) return;
    let cep = event.target.value.replace(/\D/g, '');
    if (cep.length > 5) cep = cep.replace(/(\d{5})(\d{1,3})/, "$1-$2");
    event.target.value = cep;

    if (cep.length === 9) buscarCEP(event);
}

async function buscarCEP(event) {
    if (!isPaginaNovoPedido()) return;
    if (!event || !event.target) return;
    const cep = event.target.value.replace(/\D/g, '');
    if (cep.length !== 8) return;

    try {
        const resp = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await resp.json();
        if (data.erro) {
            if (typeof mostrarFeedback === 'function') mostrarFeedback("CEP não encontrado", "error");
            return;
        }

        const map = {
            rua: data.logradouro,
            bairro: data.bairro,
            cidade: data.localidade,
            estado: data.uf
        };

        for (let campoId in map) {
            const el = document.getElementById(campoId);
            if (el) {
                el.value = map[campoId] || '';
                el.readOnly = true;
                el.classList.add('campo-preenchido');
                setTimeout(() => el.classList.remove('campo-preenchido'), 1500);
            }
        }
    } catch (err) {
        console.error("ViaCEP error:", err);
        if (typeof mostrarFeedback === 'function') mostrarFeedback("Erro ao consultar CEP", "error");
    }
}

// ==================== OBSERVAÇÃO (TABELA SEPARADA) ====================
function atualizarObservacoesPedido() {
    if (!isPaginaNovoPedido()) return;
    const texto = (document.getElementById('pedido-observacao')?.value || "").trim();
    const corpo = document.getElementById('corpo-tabela-observacao');
    if (!corpo) return;

    // Remove linhas antigas de observação (classe obs-row)
    corpo.querySelectorAll('tr.obs-row').forEach(r => r.remove());

    const placeholder = document.getElementById('nenhuma-observacao');
    if (!texto) {
        if (placeholder) placeholder.style.display = '';
        return;
    }

    if (placeholder) placeholder.style.display = 'none';

    const linha = document.createElement('tr');
    linha.classList.add('obs-row');
    linha.innerHTML = `
        <td class="obs-texto">${escapeHtml(texto)}</td>
        <td><button class="btn btn-danger btn-sm" type="button" onclick="removerObservacaoPedido()">Remover</button></td>
    `;
    corpo.appendChild(linha);
}

function removerObservacaoPedido() {
    if (!isPaginaNovoPedido()) return;
    const campo = document.getElementById('pedido-observacao');
    if (campo) campo.value = '';
    const corpo = document.getElementById('corpo-tabela-observacao');
    if (!corpo) return;
    corpo.querySelectorAll('tr.obs-row').forEach(r => r.remove());
    const placeholder = document.getElementById('nenhuma-observacao');
    if (placeholder) placeholder.style.display = '';
}

// safe-escape
function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// ==================== ADICIONAR ITEM ====================
function adicionarItemAoPedido() {
    if (!isPaginaNovoPedido()) return;
    const itemSelect = document.getElementById('item-cardapio-pedido');
    const quantidadeEl = document.getElementById('item-quantidade-pedido');
    if (!itemSelect || !quantidadeEl) return;

    const quantidade = parseInt(quantidadeEl.value, 10) || 0;
    if (!itemSelect.value || quantidade < 1) {
        if (typeof mostrarFeedback === 'function') mostrarFeedback("Escolha um item e quantidade válida!", "error");
        return;
    }

    // Verificar se o item tem ingredientes disponíveis
    const itemId = parseInt(itemSelect.value);
    const itemCardapio = cardapio.find(item => item.id === itemId);

    if (itemCardapio && estoqueCarregado && itemCardapio.ingredientes) {
        const verificacao = verificarIngredientesDisponiveis(itemCardapio.ingredientes);
        if (!verificacao.disponivel) {
            alert(`❌ Não é possível adicionar "${itemCardapio.nome}" ao pedido.\n\nMotivo: ${verificacao.motivo}`);
            return;
        }
    }

    const corpoTabela = document.getElementById('corpo-tabela-pedido');
    const totalElement = document.getElementById('pedido-total');
    if (!corpoTabela || !totalElement) return;

    const textoItem = itemSelect.options[itemSelect.selectedIndex]?.text || itemSelect.value;
    const precoMatch = textoItem.match(/R\$ ([\d.,]+)/);
    const preco = precoMatch ? parseFloat(precoMatch[1].replace(',', '.')) : 0;
    const subtotal = preco * quantidade;

    // remove placeholder
    if (corpoTabela.children.length === 1 && corpoTabela.children[0].innerText.includes("Nenhum item")) {
        corpoTabela.innerHTML = "";
    }

    const nome = textoItem.split("(")[0].trim();

    const linha = document.createElement('tr');
    linha.innerHTML = `
        <td class="item-nome">${escapeHtml(nome)}</td>
        <td>R$ ${preco.toFixed(2).replace('.', ',')}</td>
        <td>${quantidade}</td>
        <td>R$ ${subtotal.toFixed(2).replace('.', ',')}</td>
        <td><button class="btn btn-danger btn-sm" type="button" onclick="removerItemDoPedido(this, ${subtotal})">Deletar</button></td>
    `;

    corpoTabela.appendChild(linha);

    let total = parseFloat(totalElement.innerText.replace("R$ ", "").replace(",", ".")) || 0;
    total += subtotal;
    totalElement.innerText = "R$ " + total.toFixed(2).replace(".", ",");

    // reset seleção (não limpa observação)
    itemSelect.value = "";
    quantidadeEl.value = "1";
}

// ==================== REMOVER ITEM ====================
function removerItemDoPedido(botao, subtotal) {
    if (!isPaginaNovoPedido()) return;
    if (!botao) return;
    const linha = botao.closest("tr");
    if (linha) linha.remove();

    const totalElement = document.getElementById('pedido-total');
    if (!totalElement) return;

    let total = parseFloat(totalElement.innerText.replace("R$ ", "").replace(",", ".")) || 0;
    total -= parseFloat(subtotal) || 0;
    if (isNaN(total) || total < 0) total = 0;

    totalElement.innerText = "R$ " + total.toFixed(2).replace(".", ",");

    const corpo = document.getElementById('corpo-tabela-pedido');
    if (corpo && corpo.children.length === 0) {
        corpo.innerHTML = `<tr><td colspan="5" style="text-align:center;">Nenhum item adicionado.</td></tr>`;
    }
}

// ==================== REINICIAR FORMULÁRIO ====================
function reiniciarFormularioPedido() {
    if (!isPaginaNovoPedido()) return;

    console.log("Reiniciando formulário de pedido...");

    // 1. Limpa campos de cliente, telefone e observação
    const camposLimpar = [
        'pedido-cliente',
        'pedido-telefone',
        'pedido-observacao'
    ];

    camposLimpar.forEach(id => {
        const campo = document.getElementById(id);
        if (campo) {
            campo.value = '';
            campo.readOnly = false;
        }
    });

    // 2. Reseta tipo de pedido para padrão
    const tipoPedido = document.getElementById('pedido-tipo');
    if (tipoPedido) {
        tipoPedido.value = 'Local';
    }

    // 3. Limpa campos dinâmicos
    const camposDinamicos = document.getElementById('campos-dinamicos');
    if (camposDinamicos) {
        camposDinamicos.innerHTML = '';
    }

    // 4. Limpa itens da tabela
    const corpoTabela = document.getElementById('corpo-tabela-pedido');
    if (corpoTabela) {
        corpoTabela.innerHTML = '<tr><td colspan="5" style="text-align:center;">Nenhum item adicionado.</td></tr>';
    }

    // 5. Reseta total
    const totalElement = document.getElementById('pedido-total');
    if (totalElement) {
        totalElement.innerText = 'R$ 0,00';
    }

    // 6. Limpa observações
    removerObservacaoPedido();

    // 7. REINICIA OS CAMPOS QUE DEVEM SER ATUALIZADOS AUTOMATICAMENTE
    setTimeout(() => {
        // Atualiza número do pedido (próximo número)
        preencherNumeroPedido();

        // Atualiza data e hora ATUAL
        preencherDataPedido();
        preencherHorarioPedido();

        // Atualiza campos dinâmicos baseado no tipo padrão
        atualizarCamposTipoPedido();
    }, 100);

    // 8. Remove classes de estilo
    document.querySelectorAll('.campo-preenchido, .campo-preenchido-final').forEach(el => {
        el.classList.remove('campo-preenchido', 'campo-preenchido-final');
    });
}

// ==================== CANCELAR PEDIDO ====================
function cancelarPedido() {
    if (!isPaginaNovoPedido()) return;

    // Confirmação antes de cancelar
    if (!confirm("Tem certeza que deseja cancelar este pedido? Todos os dados serão perdidos.")) {
        return;
    }

    reiniciarFormularioPedido();

    if (typeof mostrarFeedback === 'function') {
        mostrarFeedback("Pedido cancelado com sucesso!", "info");
    }
}

// ==================== TOTAL ====================
function calcularTotalPedido() {
    if (!isPaginaNovoPedido()) return 0;
    let total = 0;
    document.querySelectorAll('#corpo-tabela-pedido tr').forEach(tr => {
        if (tr.cells && tr.cells.length >= 4) {
            const valor = tr.cells[3].innerText.replace("R$ ", "").replace(",", ".");
            total += parseFloat(valor) || 0;
        }
    });
    return total;
}

// ==================== MODAL DE CONFIRMAÇÃO ====================
function preencherModalConfirmacao() {
    if (!isPaginaNovoPedido()) return;

    const tipo = document.getElementById("pedido-tipo")?.value || "";

    // Função auxiliar para definir texto com fallback
    function setText(id, value, fallback = "—") {
        const el = document.getElementById(id);
        if (el) {
            el.textContent = (value !== undefined && value !== null && String(value).trim() !== "")
                ? String(value).trim()
                : fallback;
        }
    }

    // Função auxiliar para definir visibilidade
    function setVisibility(id, isVisible) {
        const el = document.getElementById(id);
        if (el) {
            el.style.display = isVisible ? "block" : "none";
        }
    }

    //MUDANÇAS PEDIDOS//
    // Preenche dados básicos do pedido
    const dadosPedido = {
        numero: document.getElementById("pedido-numero")?.value || `#${Date.now().toString().slice(-6)}`,
        cliente: document.getElementById("pedido-cliente")?.value?.trim() || "",
        telefone: document.getElementById("pedido-telefone")?.value?.trim() || "",
        tipo: document.getElementById("pedido-tipo")?.value || "",
        observacao: document.getElementById("pedido-observacao")?.value?.trim() || "",
        data: document.getElementById("pedido-data")?.value || new Date().toLocaleDateString('pt-BR'),
        horario: document.getElementById("pedido-horario")?.value || new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        total: calcularTotalPedido(),
        status: "preparo",  // NOVO: Status padrão "Em Preparo"
        itens: []
    };
    //FIM MUDANÇAS PEDIDOS//

    // Aplica os dados aos elementos
    setText("confirm-numero", dadosPedido.numero);
    setText("confirm-cliente", dadosPedido.cliente);
    setText("confirm-telefone", dadosPedido.telefone);
    setText("confirm-data", dadosPedido.data);
    setText("confirm-horario", dadosPedido.horario);
    setText("confirm-tipo", dadosPedido.tipo);
    setText("confirm-observacao", dadosPedido.observacao);

    // Preenche itens do pedido
    const listaItens = document.getElementById("confirm-itens");
    if (listaItens) {
        listaItens.innerHTML = "";
        const linhasItens = document.querySelectorAll('#corpo-tabela-pedido tr');
        const itensValidos = [];

        linhasItens.forEach((tr, index) => {
            // Verifica se é uma linha válida de item
            if (tr.cells && tr.cells.length >= 3) {
                const nome = tr.cells[0]?.textContent?.trim();
                const preco = tr.cells[1]?.textContent?.trim();
                const quantidade = tr.cells[2]?.textContent?.trim();

                // Valida se é um item real (tem nome e não é placeholder)
                if (nome && nome !== "" && !nome.toLowerCase().includes("nenhum item")) {
                    itensValidos.push({ nome, preco, quantidade, index });
                }
            }
        });

        // Adiciona itens à lista ou mensagem de vazio
        if (itensValidos.length > 0) {
            itensValidos.forEach(item => {
                const li = document.createElement("li");
                li.className = "item-confirmacao";
                li.innerHTML = `
                    <div class="item-info">
                        <span class="item-nome">${escapeHtml(item.nome)}</span>
                        <span class="item-preco">${escapeHtml(item.preco)}</span>
                    </div>
                    <div class="item-quantidade">Quantidade: <strong>${escapeHtml(item.quantidade)}</strong></div>
                `;
                listaItens.appendChild(li);
            });
        } else {
            const li = document.createElement("li");
            li.className = "sem-itens";
            li.textContent = "Nenhum item adicionado ao pedido";
            listaItens.appendChild(li);
        }
    }

    // Controla visibilidade das seções específicas
    const enderecoBox = document.getElementById("confirm-endereco");
    const mesaBox = document.getElementById("confirm-mesa");

    // Esconde ambas inicialmente
    setVisibility("confirm-endereco", false);
    setVisibility("confirm-mesa", false);

    // Mostra a seção apropriada baseada no tipo
    if (tipo === "Delivery" && enderecoBox) {
        setVisibility("confirm-endereco", true);

        // Preenche campos de endereço
        const camposEndereco = [
            { id: "confirm-cep", source: "cep" },
            { id: "confirm-rua", source: "rua" },
            { id: "confirm-numero-endereco", source: "numero-endereco" },
            { id: "confirm-complemento", source: "complemento" },
            { id: "confirm-bairro", source: "bairro" },
            { id: "confirm-cidade", source: "cidade" },
            { id: "confirm-estado", source: "estado" }
        ];

        camposEndereco.forEach(campo => {
            const elemento = document.getElementById(campo.id);
            const fonte = document.getElementById(campo.source);
            if (elemento && fonte) {
                setText(campo.id, fonte.value);
            }
        });

    } else if (tipo === "Local" && mesaBox) {
        setVisibility("confirm-mesa", true);
        const numeroMesa = document.getElementById("numero-mesa")?.value || "";
        setText("confirm-mesa-numero", numeroMesa);
    }

    // Calcula e exibe o total
    try {
        const totalPedido = calcularTotalPedido();
        setText("total-confirmacao", formatarMoeda(totalPedido));
    } catch (error) {
        console.error("Erro ao calcular total do pedido:", error);
        setText("total-confirmacao", "R$ 0,00");
    }
}

// Função auxiliar para formatar moeda
function formatarMoeda(valor) {
    if (isNaN(valor)) valor = 0;
    return `R$ ${valor.toFixed(2).replace(".", ",")}`;
}

function finalizarPedido() {
    if (!isPaginaNovoPedido()) {
        console.warn("A função finalizarPedido foi chamada fora da página de novo pedido");
        return;
    }

    // Valida se há itens no pedido
    const possuiItens = Array.from(document.querySelectorAll('#corpo-tabela-pedido tr'))
        .some(tr => {
            const nome = tr.cells?.[0]?.textContent?.trim();
            return nome &&
                nome !== "" &&
                !nome.toLowerCase().includes("nenhum item") &&
                !nome.toLowerCase().includes("nenhum produto");
        });

    if (!possuiItens) {
        if (typeof mostrarFeedback === 'function') {
            mostrarFeedback("❌ Adicione pelo menos um item antes de finalizar o pedido!", "error");
        }
        return;
    }

    // Valida dados obrigatórios
    const cliente = document.getElementById("pedido-cliente")?.value?.trim();
    if (!cliente) {
        if (typeof mostrarFeedback === 'function') {
            mostrarFeedback("❌ Informe o nome do cliente!", "error");
        }
        document.getElementById("pedido-cliente")?.focus();
        return;
    }

    // Preenche e exibe o modal
    preencherModalConfirmacao();

    // Exibe o modal com animação
    const modal = document.getElementById("modal-confirmacao");
    if (modal) {
        modal.style.display = "flex";
        setTimeout(() => {
            modal.classList.add("ativo");
        }, 10);
    }
}

function fecharModalConfirmacao() {
    const modal = document.getElementById("modal-confirmacao");
    if (modal) {
        modal.classList.remove("ativo");
        setTimeout(() => {
            modal.style.display = "none";
        }, 300);
    }
}

// ==================== CONFIRMAR ENVIO DO PEDIDO ====================
async function confirmarFinalizarPedido() {
    if (!isPaginaNovoPedido()) return;

    // Desabilita o botão para evitar duplo clique
    const botaoConfirmar = document.querySelector("#modal-confirmacao .btn-confirmar");
    const textoOriginal = botaoConfirmar?.textContent;

    if (botaoConfirmar) {
        botaoConfirmar.disabled = true;
        botaoConfirmar.innerHTML = '<span class="spinner"></span> Processando...';
    }

    try {
        // Coleta dados do pedido
        const dadosPedido = {
            cliente: document.getElementById("pedido-cliente")?.value?.trim() || "",
            telefone: document.getElementById("pedido-telefone")?.value?.trim() || "",
            tipo: document.getElementById("pedido-tipo")?.value || "",
            observacao: document.getElementById("pedido-observacao")?.value?.trim() || "",
            total: calcularTotalPedido(),
            itens: [],
            data: new Date().toISOString()
        };

        // Validações básicas
        if (!dadosPedido.cliente) {
            throw new Error("Nome do cliente é obrigatório");
        }

        // Coleta itens do pedido
        document.querySelectorAll('#corpo-tabela-pedido tr').forEach(tr => {
            if (tr.cells && tr.cells.length >= 3) {
                const nome = tr.cells[0]?.textContent?.trim();
                const precoTexto = tr.cells[1]?.textContent?.trim();
                const quantidadeTexto = tr.cells[2]?.textContent?.trim();

                if (nome && nome !== "" && !nome.toLowerCase().includes("nenhum item")) {
                    const preco = parseFloat(precoTexto?.replace("R$", "")?.replace(",", ".")?.trim()) || 0;
                    const quantidade = parseInt(quantidadeTexto) || 1;

                    // Encontrar o item do cardápio correspondente
                    const itemCardapio = cardapio.find(item => item.nome === nome);

                    dadosPedido.itens.push({
                        cardapio_id: itemCardapio?.id || 0,
                        nome: nome,
                        preco: preco,
                        quantidade: quantidade,
                        total: preco * quantidade
                    });
                }
            }
        });

        if (dadosPedido.itens.length === 0) {
            throw new Error("Adicione pelo menos um item ao pedido");
        }

        // Verificar estoque para todos os itens antes de finalizar
        for (const item of dadosPedido.itens) {
            const itemCardapio = cardapio.find(c => c.id === item.cardapio_id);
            if (itemCardapio && itemCardapio.ingredientes) {
                const verificacao = verificarIngredientesDisponiveis(itemCardapio.ingredientes);
                if (!verificacao.disponivel) {
                    throw new Error(`Não há ingredientes suficientes para preparar "${itemCardapio.nome}". Motivo: ${verificacao.motivo}`);
                }
            }
        }

        // Adiciona dados específicos do tipo
        if (dadosPedido.tipo === "Delivery") {
            dadosPedido.endereco = {
                cep: document.getElementById("cep")?.value?.trim() || "",
                rua: document.getElementById("rua")?.value?.trim() || "",
                numero: document.getElementById("numero-endereco")?.value?.trim() || "",
                complemento: document.getElementById("complemento")?.value?.trim() || "",
                bairro: document.getElementById("bairro")?.value?.trim() || "",
                cidade: document.getElementById("cidade")?.value?.trim() || "",
                estado: document.getElementById("estado")?.value?.trim() || ""
            };
        } else if (dadosPedido.tipo === "Local") {
            dadosPedido.mesa = document.getElementById("numero-mesa")?.value?.trim() || "";
        }

        // Envia para a API
        if (typeof apiPost !== "function") {
            console.warn("API não disponível - Simulando envio");
            // Simulação de sucesso para desenvolvimento
            setTimeout(() => {
                if (typeof mostrarFeedback === 'function') {
                    mostrarFeedback("✅ Pedido criado com sucesso! (Modo simulação)", "success");
                }
                fecharModalConfirmacao();
                // REINICIA O FORMULÁRIO APÓS SUCESSO
                setTimeout(() => {
                    reiniciarFormularioPedido();
                }, 500);
                return;
            }, 800);
            return;
        }

        // Envio real para API
        const resposta = await apiPost('module=pedidos&action=criar', dadosPedido);

        if (resposta && resposta.success) {
            // DAR BAIXA NO ESTOQUE PARA CADA ITEM DO PEDIDO
            for (const item of dadosPedido.itens) {
                if (item.cardapio_id) {
                    await darBaixaEstoque(item.cardapio_id, item.quantidade);
                }
            }

            if (typeof mostrarFeedback === 'function') {
                const numeroPedido = resposta.numero_pedido || "N/A";
                mostrarFeedback(`✅ Pedido #${numeroPedido} registrado com sucesso!`, "success", 5000);
            }

            fecharModalConfirmacao();
            adicionarPedidoAListaAtiva(dadosPedido);//MUDANÇAS PEDIDOS (ADD ESSA LINHA)

            // REINICIA O FORMULÁRIO APÓS SUCESSO
            setTimeout(() => {
                reiniciarFormularioPedido();

                // Atualiza a lista de pedidos se a função existir
                if (typeof carregarPedidos === 'function') carregarPedidos();

                // Atualizar disponibilidade do cardápio após dar baixa no estoque
                if (cardapio.length > 0) {
                    verificarDisponibilidadeCardapio();
                }
            }, 500);

        } else {
            const mensagemErro = resposta?.message || "Erro desconhecido ao registrar pedido";
            throw new Error(mensagemErro);
        }

    } catch (erro) {
        console.error("Erro ao confirmar pedido:", erro);

        if (typeof mostrarFeedback === 'function') {
            const mensagem = erro.message || "Falha ao processar o pedido. Tente novamente.";
            mostrarFeedback(`❌ ${mensagem}`, "error", 5000);
        }

        // Fecha o modal apenas em caso de erro de validação (não de rede)
        if (!erro.message.includes("obrigatório") && !erro.message.includes("Adicione")) {
            fecharModalConfirmacao();
        }

    } finally {
        // Reabilita o botão
        if (botaoConfirmar) {
            botaoConfirmar.disabled = false;
            botaoConfirmar.textContent = textoOriginal;
        }
    }
}

// Event listeners para melhor UX
document.addEventListener('DOMContentLoaded', function () {
    // Fecha modal com ESC
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            fecharModalConfirmacao();
        }
    });

    // Fecha modal ao clicar fora
    const modal = document.getElementById("modal-confirmacao");
    if (modal) {
        modal.addEventListener('click', function (e) {
            if (e.target === this) {
                fecharModalConfirmacao();
            }
        });
    }
});
//madal e confirmação termina aqui


// ==================== AUTO-INICIAR CAMPOS E EVENTOS ====================
document.addEventListener("DOMContentLoaded", () => {
    // só rodar lógica se estiver na página NOVO PEDIDO
    if (isPaginaNovoPedido()) {
        preencherDataPedido();
        preencherHorarioPedido();
        preencherNumeroPedido();
    }

    const obs = document.getElementById('pedido-observacao');
    if (obs) obs.addEventListener('input', atualizarObservacoesPedido);

    atualizarObservacoesPedido();
});


// ==================== FUNÇÃO PARA CARREGAR TRANSAÇÕES FINANCEIRAS ====================
async function carregarTransacoes() {
    try {
        console.log("📊 Carregando transações financeiras...");

        // Se estiver na página de financeiro
        const isFinanceiroPage = window.location.hash === '#financeiro' ||
            document.getElementById('secao-financeiro');

        if (!isFinanceiroPage) {
            console.log("📊 Não está na página de financeiro, pulando carregamento");
            return;
        }

        // Chama a API para listar transações financeiras
        const transacoes = await apiGet('module=financeiro&action=listar');

        if (transacoes && transacoes.success && transacoes.data) {
            console.log(`📊 ${transacoes.data.length} transações carregadas`);
            preencherTabelaFinanceiro(transacoes.data);
            atualizarTotaisFinanceiro(transacoes.totais);
        } else {
            console.warn("📊 Nenhuma transação encontrada ou erro na resposta");
            // Mostra tabela vazia
            preencherTabelaFinanceiro([]);
        }

    } catch (error) {
        console.error("❌ Erro ao carregar transações:", error);
        // Mostra mensagem de erro na interface
        if (typeof mostrarFeedback === 'function') {
            mostrarFeedback("Erro ao carregar transações financeiras", "error");
        }
    }
}

// ==================== FUNÇÃO PARA PREENCHER TABELA FINANCEIRO ====================
function preencherTabelaFinanceiro(transacoes) {
    const tbody = document.getElementById('corpo-tabela-financeiro');
    const tabelaVazia = document.getElementById('tabela-financeiro-vazia');

    if (!tbody) {
        console.warn("📊 Tabela financeiro não encontrada no DOM");
        return;
    }

    // Limpa a tabela
    tbody.innerHTML = '';

    // Se não houver transações, mostra mensagem
    if (!transacoes || transacoes.length === 0) {
        if (tabelaVazia) {
            tabelaVazia.style.display = 'table-row';
        }
        tbody.innerHTML = `
            <tr id="tabela-financeiro-vazia">
                <td colspan="8" style="text-align: center; padding: 40px;">
                    <div style="color: #6c757d; font-size: 16px;">
                        <i class="fas fa-wallet" style="font-size: 48px; margin-bottom: 16px; opacity: 0.5;"></i>
                        <p>Nenhuma transação financeira registrada</p>
                        <small>Crie um pedido para gerar uma entrada no financeiro</small>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    // Esconde mensagem de tabela vazia se existir
    if (tabelaVazia) {
        tabelaVazia.style.display = 'none';
    }

    // Preenche a tabela com as transações
    transacoes.forEach((transacao, index) => {
        const row = document.createElement('tr');

        // Formata data
        const data = transacao.data ? new Date(transacao.data).toLocaleDateString('pt-BR') : '--';

        // Formata valor com cor baseada no tipo
        const valor = parseFloat(transacao.valor || 0).toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        });

        // Define classe CSS baseada no tipo
        const tipoClass = transacao.tipo === 'entrada' ? 'text-success' : 'text-danger';
        const tipoIcon = transacao.tipo === 'entrada' ? 'fa-arrow-down' : 'fa-arrow-up';

        // Formata forma de pagamento
        const formasPagamento = {
            'dinheiro': 'Dinheiro',
            'cartao_credito': 'Cartão Crédito',
            'cartao_debito': 'Cartão Débito',
            'pix': 'PIX',
            'transferencia': 'Transferência',
            'outro': 'Outro'
        };

        const formaPagamento = formasPagamento[transacao.forma_pagamento] || transacao.forma_pagamento;

        row.innerHTML = `
            <td>${transacao.id || '--'}</td>
            <td>${data}</td>
            <td>
                <span class="${tipoClass}">
                    <i class="fas ${tipoIcon} me-1"></i>
                    ${transacao.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                </span>
            </td>
            <td>${transacao.categoria || '--'}</td>
            <td>${transacao.descricao || '--'}</td>
            <td class="${tipoClass} fw-bold">${valor}</td>
            <td>${formaPagamento}</td>
            <td>${transacao.funcionario_nome || '--'}</td>
        `;

        tbody.appendChild(row);
    });
}

// ==================== FUNÇÃO PARA ATUALIZAR TOTAIS FINANCEIRO ====================
function atualizarTotaisFinanceiro(totais) {
    // Atualiza totais no dashboard financeiro
    const elementos = {
        'total-entradas': totais?.total_entradas || 0,
        'total-saidas': totais?.total_saidas || 0,
        'saldo-total': (totais?.total_entradas || 0) - (totais?.total_saidas || 0)
    };

    Object.keys(elementos).forEach(id => {
        const elemento = document.getElementById(id);
        if (elemento) {
            const valor = parseFloat(elementos[id]);
            const formatado = valor.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL'
            });

            // Adiciona classe de cor baseada no valor
            if (id === 'saldo-total') {
                elemento.className = valor >= 0 ? 'text-success' : 'text-danger';
            }

            elemento.textContent = formatado;
        }
    });
}

// ==================== FUNÇÃO PARA ADICIONAR TRANSAÇÃO MANUAL ====================
async function adicionarTransacaoManual(dados) {
    try {
        console.log("➕ Adicionando transação manual:", dados);

        const resposta = await apiPost('module=financeiro&action=criar', dados);

        if (resposta && resposta.success) {
            console.log("✅ Transação adicionada com ID:", resposta.id);

            // Recarrega a lista de transações
            await carregarTransacoes();

            if (typeof mostrarFeedback === 'function') {
                mostrarFeedback("Transação registrada com sucesso!", "success");
            }

            return resposta;
        } else {
            throw new Error(resposta?.message || 'Erro ao adicionar transação');
        }
    } catch (error) {
        console.error("❌ Erro ao adicionar transação:", error);
        throw error;
    }
}

// ==================== LISTENER PARA A PÁGINA DE FINANCEIRO ====================
document.addEventListener('DOMContentLoaded', function () {
    // Carrega transações se estiver na página de financeiro
    setTimeout(() => {
        const isFinanceiroPage = window.location.hash === '#financeiro' ||
            document.getElementById('secao-financeiro');

        if (isFinanceiroPage) {
            console.log("📊 Página de financeiro detectada, carregando transações...");
            carregarTransacoes();
        }
    }, 500);

    // Adiciona listener para mudança de hash (mudança de página no SPA)
    window.addEventListener('hashchange', function () {
        if (window.location.hash === '#financeiro') {
            console.log("📊 Mudou para página de financeiro, carregando transações...");
            setTimeout(() => carregarTransacoes(), 300);
        }
    });

    // Se já estiver na página de financeiro ao carregar
    if (window.location.hash === '#financeiro') {
        console.log("📊 Já está na página de financeiro, carregando transações...");
        setTimeout(() => carregarTransacoes(), 1000);
    }
});

// ==================== EXPORTAR FUNÇÕES PARA USO GLOBAL ====================
window.carregarTransacoes = carregarTransacoes;
window.preencherTabelaFinanceiro = preencherTabelaFinanceiro;
window.atualizarTotaisFinanceiro = atualizarTotaisFinanceiro;
window.adicionarTransacaoManual = adicionarTransacaoManual;


// ==================== SISTEMA DE CADASTROS ====================
let funcionarios = [];
let fornecedores = [];

function selecionarTipoCadastro() {
    const valor = document.getElementById('tipo-cadastro').value;

    // Obter referências
    const tabelaFuncionarios = document.getElementById('tabela-funcionarios');
    const tabelaFornecedores = document.getElementById('tabela-fornecedores');

    // Primeiro, esconder ambas as tabelas
    if (tabelaFuncionarios) tabelaFuncionarios.style.display = 'none';
    if (tabelaFornecedores) tabelaFornecedores.style.display = 'none';

    // Depois, mostrar apenas a selecionada
    if (valor === 'funcionarios') {
        if (tabelaFuncionarios) {
            tabelaFuncionarios.style.display = 'block';
            // Se já carregou os dados antes, apenas renderiza
            if (funcionarios.length > 0) {
                renderizarTabelaFuncionarios();
            } else {
                carregarFuncionariosDoBackend();
            }
        }
    } else if (valor === 'fornecedores') {
        if (tabelaFornecedores) {
            tabelaFornecedores.style.display = 'block';
            // Se já carregou os dados antes, apenas renderiza
            if (fornecedores.length > 0) {
                renderizarTabelaFornecedores();
            } else {
                carregarFornecedoresDoBackend();
            }
        }
    }
    // Se for "Selecione", ambas ficam escondidas
}

// ==================== FUNÇÕES PARA FUNCIONÁRIOS ====================
async function carregarFuncionariosDoBackend() {
    try {
        console.log('Carregando funcionários...');
        const data = await apiGet('module=funcionarios&action=listar');

        if (Array.isArray(data)) {
            funcionarios = data.map(func => ({
                id: Number(func.id),
                nome_completo: func.nome_completo || "",
                matricula: func.matricula || "",
                cpf: func.cpf || "",
                cargo: func.cargo || "",
                salario: parseFloat(func.salario || 0),
                turno: func.turno || "",
                data_admissao: formatarData(func.data_admissao),
                telefone_celular: func.telefone_celular || "",
                email: func.email || "",
                rua: func.rua || "",
                numero: func.numero || "",
                complemento: func.complemento || "",
                bairro: func.bairro || "",
                cidade: func.cidade || "",
                estado: func.estado || "",
                cep: func.cep || "",
                ativo: func.ativo == 1 || func.ativo === true || func.ativo === "1",
                nivel_acesso: func.nivel_acesso || "funcionario",
                data_cadastro: formatarData(func.data_cadastro),
                sexo: func.sexo || "",
                data_nascimento: formatarData(func.data_nascimento),
                telefone_emergencia: func.telefone_emergencia || ""
            }));

            console.log("Funcionários carregados:", funcionarios.length);

            // Atualizar estatísticas imediatamente
            atualizarEstatisticasFuncionarios();

            // Se a tabela de funcionários estiver visível, renderizar
            const tabelaFuncionarios = document.getElementById('tabela-funcionarios');
            if (tabelaFuncionarios && tabelaFuncionarios.style.display !== 'none') {
                renderizarTabelaFuncionarios();
            }

            return true;
        } else {
            console.error("Resposta inesperada para funcionários:", data);
            funcionarios = [];
            atualizarEstatisticasFuncionarios();
            return false;
        }
    } catch (err) {
        console.error("Erro ao carregar funcionários:", err);
        funcionarios = [];
        atualizarEstatisticasFuncionarios();
        return false;
    }
}

function renderizarTabelaFuncionarios() {
    const corpo = document.getElementById('corpo-tabela-funcionarios');
    if (!corpo) {
        console.error('Elemento #corpo-tabela-funcionarios não encontrado!');
        return;
    }

    corpo.innerHTML = "";

    if (funcionarios.length === 0) {
        corpo.innerHTML = `
            <tr>
                <td colspan="5" style="text-align:center; padding: 40px; color: #999;">
                    Nenhum funcionário cadastrado.
                </td>
            </tr>
        `;
        return;
    }

    funcionarios.forEach(func => {
        const tr = document.createElement('tr');

        // Cor aleatória para o avatar
        const cor = Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
        const inicial = func.nome_completo ? func.nome_completo.charAt(0).toUpperCase() : '?';

        tr.innerHTML = `
            <td>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div style="width: 40px; height: 40px; background-color: #${cor}; 
                         border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">
                        ${inicial}
                    </div>
                    <div>
                        <strong>${func.nome_completo}</strong><br>
                        <small style="color: #666; font-size: 0.85rem;">Matrícula: ${func.matricula || 'Não informada'}</small>
                    </div>
                </div>
            </td>
            <td>${formatarCPF(func.cpf) || 'N/A'}</td>
            <td>${func.cargo || 'N/A'}</td>
            <td>${func.turno || 'N/A'}</td>
            <td>
                <div class="btn-group">
                    <button class="btn-ver" onclick="abrirModalFuncionario(${func.id})" style="
                        background-color: #dc3545; 
                        color: white;
                        border: none;
                        padding: 6px 12px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 0.875rem;
                        transition: background-color 0.3s;
                    " onmouseover="this.style.backgroundColor='#c82333'" 
                     onmouseout="this.style.backgroundColor='#dc3545'">
                        🔎 Ver
                    </button>
                </div>
            </td>
        `;

        corpo.appendChild(tr);
    });
}

function atualizarEstatisticasFuncionarios() {
    const funcionariosAtivos = funcionarios.filter(f => f.ativo).length;
    const totalFuncionarios = funcionarios.length;

    const estatisticaFuncionarios = document.getElementById('total-funcionarios');
    if (estatisticaFuncionarios) {
        estatisticaFuncionarios.textContent = totalFuncionarios;
    }
}

// ==================== FUNÇÕES PARA FORNECEDORES ====================
async function carregarFornecedoresDoBackend() {
    try {
        console.log('Carregando fornecedores...');
        const data = await apiGet('module=fornecedores&action=listar');

        if (Array.isArray(data)) {
            fornecedores = data.map(forn => ({
                id: String(forn.id),
                nome_empresa: forn.razao_social || "",
                razao_social: forn.razao_social || "",
                cnpj: forn.cnpj || "",
                responsavel: forn.responsavel || "",
                telefone: forn.telefone || "",
                email: forn.email || "",
                rua: forn.rua || "",
                numero: forn.numero || "",
                complemento: forn.complemento || "",
                bairro: forn.bairro || "",
                cidade: forn.cidade || "",
                estado: forn.estado || "",
                cep: forn.cep || "",
                produtos_fornecidos: forn.produtos_fornecidos || "",
                prazo_entrega: forn.prazo_entrega || "",
                ativo: forn.ativo == 1 || forn.ativo === true || forn.ativo === "1",
                data_cadastro: formatarData(forn.data_cadastro)
            }));

            console.log("Fornecedores carregados:", fornecedores.length);

            // Atualizar estatísticas imediatamente
            atualizarEstatisticasFornecedores();

            // Se a tabela de fornecedores estiver visível, renderizar
            const tabelaFornecedores = document.getElementById('tabela-fornecedores');
            if (tabelaFornecedores && tabelaFornecedores.style.display !== 'none') {
                renderizarTabelaFornecedores();
            }

            return true;
        } else {
            console.error("Resposta inesperada para fornecedores:", data);
            fornecedores = [];
            atualizarEstatisticasFornecedores();
            return false;
        }
    } catch (err) {
        console.error("Erro ao carregar fornecedores:", err);
        fornecedores = [];
        atualizarEstatisticasFornecedores();
        return false;
    }
}

function renderizarTabelaFornecedores() {
    const corpo = document.getElementById('corpo-tabela-fornecedores');
    if (!corpo) {
        console.error('Elemento #corpo-tabela-fornecedores não encontrado!');
        return;
    }

    corpo.innerHTML = "";

    if (fornecedores.length === 0) {
        corpo.innerHTML = `
            <tr>
                <td colspan="5" style="text-align:center; padding: 40px; color: #999;">
                    Nenhum fornecedor cadastrado.
                </td>
            </tr>
        `;
        return;
    }

    fornecedores.forEach(forn => {
        const tr = document.createElement('tr');

        // Cor aleatória para o avatar
        const cor = Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
        const inicial = forn.nome_empresa ? forn.nome_empresa.charAt(0).toUpperCase() : '?';

        tr.innerHTML = `
            <td>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div style="width: 40px; height: 40px; background-color: #${cor}; 
                         border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">
                        ${inicial}
                    </div>
                    <div>
                        <strong>${forn.nome_empresa}</strong><br>
                        <small style="color: #666; font-size: 0.85rem;">${forn.responsavel || 'Sem responsável'}</small>
                    </div>
                </div>
            </td>
            <td>${formatarCNPJ(forn.cnpj) || 'N/A'}</td>
            <td>${formatarTelefone(forn.telefone) || 'N/A'}</td>
            <td>${forn.email || 'N/A'}</td>
            <td>
                <div class="btn-group">
                    <button class="btn-ver" onclick="abrirModalFornecedor('${forn.id}')" style="
                        background-color: #dc3545; 
                        color: white;
                        border: none;
                        padding: 6px 12px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 0.875rem;
                        transition: background-color 0.3s;
                        " onmouseover="this.style.backgroundColor='#c82333'" 
                        onmouseout="this.style.backgroundColor='#dc3545'">
                        🔎 Ver
                    </button>

                </div>
            </td>
        `;

        corpo.appendChild(tr);
    });
}

function atualizarEstatisticasFornecedores() {
    const fornecedoresAtivos = fornecedores.filter(f => f.ativo).length;
    const totalFornecedores = fornecedores.length;

    const estatisticaFornecedores = document.getElementById('total-fornecedores');
    if (estatisticaFornecedores) {
        estatisticaFornecedores.textContent = totalFornecedores;
    }
}

// ==================== FUNÇÕES AUXILIARES ====================
function formatarCPF(cpf) {
    if (!cpf) return '';
    cpf = cpf.replace(/\D/g, '');
    if (cpf.length === 11) {
        return cpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
    }
    return cpf;
}

function formatarCNPJ(cnpj) {
    if (!cnpj) return '';
    cnpj = cnpj.replace(/\D/g, '');
    if (cnpj.length === 14) {
        return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
    }
    return cnpj;
}

function formatarTelefone(telefone) {
    if (!telefone) return '';
    telefone = telefone.replace(/\D/g, '');
    if (telefone.length === 10) {
        return telefone.replace(/^(\d{2})(\d{4})(\d{4})$/, "($1) $2-$3");
    } else if (telefone.length === 11) {
        return telefone.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
    }
    return telefone;
}

function formatarData(data) {
    if (!data) return '';
    const dataObj = new Date(data);
    if (isNaN(dataObj.getTime())) return data;

    return dataObj.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

// ==================== FUNÇÕES PARA OS MODAIS ====================
function abrirModalFuncionario(id = null) {
    if (id) {
        const funcionario = funcionarios.find(f => f.id === id);
        if (funcionario) {
            preencherModalFuncionario(funcionario);
        }
    }
    const modal = document.getElementById('modal-funcionario');
    if (modal) {
        modal.style.display = 'flex';
    }
}

function fecharModalFuncionario() {
    const modal = document.getElementById('modal-funcionario');
    if (modal) {
        modal.style.display = 'none';
    }
}

function abrirModalFornecedor(id = null) {
    console.log('abrirModalFornecedor chamado com id:', id);

    if (id) {
        const fornecedor = fornecedores.find(f => f.id === id);
        console.log('Fornecedor encontrado em abrirModalFornecedor:', fornecedor);

        if (fornecedor) {
            preencherModalFornecedor(fornecedor);
        }
    }

    const modal = document.getElementById('modal-fornecedor');
    if (modal) {
        alert('ABRINDO MODAL DO FORNECEDOR'); // 👈 só pra testar
        modal.style.display = 'flex';
    }
}




function fecharModalFornecedor() {
    const modal = document.getElementById('modal-fornecedor');
    if (modal) {
        modal.style.display = 'none';
    }
}

function preencherModalFuncionario(funcionario) {
    console.log('Preenchendo modal do funcionário:', funcionario);

    // Informações Pessoais
    setElementText('func-matricula', funcionario.matricula || 'Não informada');
    setElementText('func-cpf', formatarCPF(funcionario.cpf) || 'Não informado');
    setElementText('func-nome', funcionario.nome_completo || 'Não informado');
    setElementText('func-nome-social', funcionario.nome_completo || 'Não informado');
    setElementText('func-sexo', funcionario.sexo ? (funcionario.sexo === 'M' ? 'Masculino' : 'Feminino') : 'Não informado');
    setElementText('func-data-nascimento', funcionario.data_nascimento || 'Não informada');

    // Informações Profissionais
    setElementText('func-cargo', funcionario.cargo || 'Não informado');
    setElementText('func-salario', funcionario.salario ? `R$ ${funcionario.salario.toFixed(2).replace('.', ',')}` : 'Não informado');
    setElementText('func-turno', funcionario.turno || 'Não informado');
    setElementText('func-data-admissao', funcionario.data_admissao || 'Não informada');
    setElementText('func-razao-social', 'Burguer');

    // Contato
    setElementText('func-telefone-fixo', 'Não informado');
    setElementText('func-telefone-celular', formatarTelefone(funcionario.telefone_celular) || 'Não informado');
    setElementText('func-telefone-emergencia', formatarTelefone(funcionario.telefone_emergencia) || 'Não informado');
    setElementText('func-email', funcionario.email || 'Não informado');

    // Endereço
    setElementText('func-cep', funcionario.cep || 'Não informado');
    setElementText('func-rua', funcionario.rua || 'Não informado');
    setElementText('func-complemento', funcionario.complemento || 'Não informado');
    setElementText('func-numero', funcionario.numero || 'Não informado');
    setElementText('func-bairro', funcionario.bairro || 'Não informado');
    setElementText('func-cidade', funcionario.cidade || 'Não informado');
    setElementText('func-estado', funcionario.estado || 'Não informado');

    // Status (ainda aparece no modal, mas não na tabela)
    setElementText('func-status', funcionario.ativo ? 'Ativo' : 'Inativo');
    const badge = document.getElementById('func-status');
    if (badge) {
        badge.className = 'badge ' + (funcionario.ativo ? 'badge-success' : 'badge-danger');
    }
    setElementText('func-data-cadastro', funcionario.data_cadastro || 'Não informada');
}

function preencherModalFornecedor(fornecedor) {
    console.log('Preenchendo modal do fornecedor:', fornecedor);

    // Informações da Empresa
    setElementText('forn-cnpj', formatarCNPJ(fornecedor.cnpj) || 'Não informado');
    setElementText('forn-razao-social', fornecedor.razao_social || fornecedor.nome_empresa || 'Não informado');
    setElementText('forn-data-cadastro', fornecedor.data_cadastro || 'Não informada');
    setElementText('forn-status', fornecedor.ativo ? 'Ativo' : 'Inativo');

    const badge = document.getElementById('forn-status');
    if (badge) {
        badge.className = 'badge ' + (fornecedor.ativo ? 'badge-success' : 'badge-danger');
    }

    // Representante
    setElementText('forn-responsavel', fornecedor.responsavel || 'Não informado');
    setElementText('forn-cargo-representante', 'Representante Comercial');

    // Contato
    setElementText('forn-telefone', formatarTelefone(fornecedor.telefone) || 'Não informado');
    setElementText('forn-email', fornecedor.email || 'Não informado');

    // Endereço
    setElementText('forn-cep', fornecedor.cep || 'Não informado');
    setElementText('forn-rua', fornecedor.rua || 'Não informado');
    setElementText('forn-numero', fornecedor.numero || 'Não informado');
    setElementText('forn-complemento', fornecedor.complemento || 'Não informado');
    setElementText('forn-bairro', fornecedor.bairro || 'Não informado');
    setElementText('forn-cidade', fornecedor.cidade || 'Não informado');
    setElementText('forn-estado', fornecedor.estado || 'Não informado');

    // Produtos e Prazo
    setElementText('forn-produtos', fornecedor.produtos_fornecidos || 'Não especificado');
    setElementText('forn-prazo-entrega', fornecedor.prazo_entrega || 'Não especificado');
}

function setElementText(id, text) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = text;
    }
}


// Função para fazer requisições GET para a API
async function apiGet(params) {
    try {
        // Caminho correto para sua pasta
        const url = `http://localhost/Projeto-integrador_Edutech_IA/api.php?${params}`;
        console.log('Chamando API:', url);
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Resposta da API:', data);
        
        return data;
    } catch (error) {
        console.error('Erro na requisição:', error);
        return [];
    }
}

// ==================== CARREGAMENTO AUTOMÁTICO ====================
async function carregarTodasEstatisticas() {
    console.log('Carregando todas as estatísticas...');

    // Mostrar estado de carregamento
    const estatisticaFuncionarios = document.getElementById('total-funcionarios');
    const estatisticaFornecedores = document.getElementById('total-fornecedores');

    if (estatisticaFuncionarios) {
        estatisticaFuncionarios.textContent = '...';
    }
    if (estatisticaFornecedores) {
        estatisticaFornecedores.textContent = '...';
    }

    try {
        // Carregar funcionários e fornecedores simultaneamente
        const [funcionariosResult, fornecedoresResult] = await Promise.allSettled([
            carregarFuncionariosDoBackend(),
            carregarFornecedoresDoBackend()
        ]);

        console.log('Carregamento concluído:', {
            funcionarios: funcionariosResult.status,
            fornecedores: fornecedoresResult.status
        });

    } catch (err) {
        console.error('Erro ao carregar estatísticas:', err);

        // Definir valores padrão em caso de erro
        if (estatisticaFuncionarios) {
            estatisticaFuncionarios.textContent = '0';
        }
        if (estatisticaFornecedores) {
            estatisticaFornecedores.textContent = '0';
        }
    }
}

// ==================== INICIALIZAÇÃO ====================
document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM carregado - inicializando módulo de cadastros');

    // Carregar estatísticas automaticamente quando a página carrega
    carregarTodasEstatisticas();

    // Opcional: Atualizar estatísticas periodicamente (a cada 60 segundos)
    setInterval(carregarTodasEstatisticas, 60000);
});

// ==================== SISTEMA DE RELATÓRIOS COMPLETO ====================

function baixarRelatorioArquivo(texto, numero, tipo) {
    try {
        const blob = new Blob([texto], { type: 'text/plain;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${numero}-${tipo}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        return true;
    } catch (error) {
        console.error('Erro ao baixar arquivo:', error);
        alert('Erro ao baixar o arquivo. Tente novamente.');
        return false;
    }
}

function getNomeRelatorio(tipo) {
    const nomes = {
        'pedidos': 'Pedidos',
        'estoque': 'Estoque',
        'cardapio': 'Cardápio',
        'financeiro': 'Financeiro',
        'funcionarios': 'Funcionários'
    };
    return nomes[tipo] || tipo;
}

function preencherDataHoraRelatorio() {
    if (!isPaginaRelatorios()) return;

    console.log('Preenchendo data e hora do relatório...');

    const dataAtual = new Date();
    const dia = String(dataAtual.getDate()).padStart(2, '0');
    const mes = String(dataAtual.getMonth() + 1).padStart(2, '0');
    const ano = dataAtual.getFullYear();

    const campoData = document.getElementById('relatorio-data-rel');
    if (campoData) {
        campoData.value = `${dia}/${mes}/${ano}`;
        console.log('Data preenchida:', campoData.value);
    }

    const horas = String(dataAtual.getHours()).padStart(2, '0');
    const minutos = String(dataAtual.getMinutes()).padStart(2, '0');

    const campoHorario = document.getElementById('relatorio-horario');
    if (campoHorario) {
        campoHorario.value = `${horas}:${minutos}`;
        console.log('Horário preenchido:', campoHorario.value);
    }

    const campoDataInicio = document.getElementById('relatorio-data-inicio');
    if (campoDataInicio && !campoDataInicio.value) {
        campoDataInicio.value = `${dia}/${mes}/${ano}`;
    }

    const campoDataFinal = document.getElementById('relatorio-data-final');
    if (campoDataFinal && !campoDataFinal.value) {
        campoDataFinal.value = `${dia}/${mes}/${ano}`;
    }

    const campoNumero = document.getElementById('relatorio-numero');
    if (campoNumero && !campoNumero.value) {
        const timestamp = Date.now().toString().slice(-6);
        campoNumero.value = `REL-${timestamp}`;
        console.log('Número do relatório gerado:', campoNumero.value);
    }

    const campoResponsavel = document.getElementById('relatorio-responsavel');
    if (campoResponsavel && !campoResponsavel.value) {
        const nomeUsuario = localStorage.getItem('usuarioNome') || 'Administrador';
        campoResponsavel.value = nomeUsuario;
    }
}

function configurarMascarasDataRelatorio() {
    if (!isPaginaRelatorios()) return;

    const camposData = [
        'relatorio-data-inicio',
        'relatorio-data-final',
        'relatorio-data-rel'
    ];

    camposData.forEach(id => {
        const campo = document.getElementById(id);
        if (campo) {
            campo.addEventListener('input', function (e) {
                mascaraDataSimples(this);
            });

            campo.setAttribute('placeholder', 'DD/MM/AAAA');
            campo.setAttribute('maxlength', '10');
        }
    });
}

function validarDatasRelatorio() {
    if (!isPaginaRelatorios()) return true;

    const dataInicio = document.getElementById('relatorio-data-inicio')?.value;
    const dataFinal = document.getElementById('relatorio-data-final')?.value;

    if (!dataInicio) {
        alert('Por favor, informe a data de início do relatório.');
        return false;
    }

    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(dataInicio)) {
        alert('Formato da data de início inválido. Use DD/MM/AAAA.');
        return false;
    }

    if (dataFinal && dataFinal.trim() !== '') {
        if (!/^\d{2}\/\d{2}\/\d{4}$/.test(dataFinal)) {
            alert('Formato da data final inválido. Use DD/MM/AAAA.');
            return false;
        }

        const partesInicio = dataInicio.split('/');
        const partesFinal = dataFinal.split('/');

        const dataInicioObj = new Date(partesInicio[2], partesInicio[1] - 1, partesInicio[0]);
        const dataFinalObj = new Date(partesFinal[2], partesFinal[1] - 1, partesFinal[0]);

        if (dataFinalObj < dataInicioObj) {
            alert('A data final não pode ser anterior à data de início.');
            return false;
        }
    }

    return true;
}

async function gerarRelatorio() {
    console.log('Função gerarRelatorio() iniciada');

    if (!isPaginaRelatorios()) {
        console.warn('Não está na página de relatórios');
        alert('⚠️ Por favor, navegue até a página "Relatórios" para usar esta função.');
        return;
    }

    const tipoRelatorio = document.getElementById('relatorio-tipo')?.value;
    const numeroRelatorio = document.getElementById('relatorio-numero')?.value || `REL-${Date.now().toString().slice(-6)}`;
    const dataInicio = document.getElementById('relatorio-data-inicio')?.value;
    const dataFinal = document.getElementById('relatorio-data-final')?.value || dataInicio;
    const horario = document.getElementById('relatorio-horario')?.value || new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const responsavel = document.getElementById('relatorio-responsavel')?.value;
    const dataGeracao = document.getElementById('relatorio-data-rel')?.value || new Date().toLocaleDateString('pt-BR');

    console.log('Dados coletados:', { tipoRelatorio, numeroRelatorio, dataInicio, dataFinal, responsavel });

    if (!tipoRelatorio) {
        alert('❌ Selecione o tipo de relatório!');
        document.getElementById('relatorio-tipo')?.focus();
        return;
    }

    if (!dataInicio) {
        alert('❌ Informe a data de início do período!');
        document.getElementById('relatorio-data-inicio')?.focus();
        return;
    }

    if (!responsavel) {
        alert('❌ Informe o responsável pelo relatório!');
        document.getElementById('relatorio-responsavel')?.focus();
        return;
    }

    const loading = criarLoading();
    loading.style.display = 'flex';

    await new Promise(resolve => setTimeout(resolve, 500));

    try {
        console.log('Gerando relatório do tipo:', tipoRelatorio);

        let conteudoRelatorio;

        switch (tipoRelatorio) {
            case 'pedidos':
                conteudoRelatorio = await gerarRelatorioPedidos(dataInicio, dataFinal);
                break;
            case 'estoque':
                conteudoRelatorio = await gerarRelatorioEstoque();
                break;
            case 'cardapio':
                conteudoRelatorio = await gerarRelatorioCardapio();
                break;
            case 'financeiro':
                conteudoRelatorio = await gerarRelatorioFinanceiro(dataInicio, dataFinal);
                break;
            case 'funcionarios':
                conteudoRelatorio = await gerarRelatorioFuncionarios();
                break;
            default:
                throw new Error('Tipo de relatório não suportado');
        }

        const relatorioFinal = formatarRelatorioFinal(
            tipoRelatorio,
            conteudoRelatorio,
            {
                numero: numeroRelatorio,
                dataInicio: dataInicio,
                dataFinal: dataFinal,
                horario: horario,
                responsavel: responsavel,
                dataGeracao: dataGeracao
            }
        );

        console.log('Relatório gerado com sucesso!');

        const opcao = prompt(
            `✅ Relatório "${getNomeRelatorio(tipoRelatorio)}" gerado com sucesso!\n\n` +
            `Número: ${numeroRelatorio}\n` +
            `O que você gostaria de fazer?\n\n` +
            `1 - Visualizar na tela\n` +
            `2 - Baixar como arquivo (.txt)\n` +
            `3 - Copiar para área de transferência\n\n` +
            `Digite 1, 2 ou 3:`,
            "1"
        );

        // cancelar (null), apenas sai da função
        if (opcao === null) {
            return; // Apenas fecha o diálogo, não faz nada
        }

        if (opcao === '1') {
            mostrarRelatorioNaTela(relatorioFinal, numeroRelatorio, tipoRelatorio);
        } else if (opcao === '2') {
            baixarRelatorioComoArquivo(relatorioFinal, numeroRelatorio, tipoRelatorio);
        } else if (opcao === '3') {
            copiarParaAreaTransferencia(relatorioFinal);
        } else {
            alert('❌ Opção inválida! Digite 1, 2 ou 3.');
        }

    } catch (error) {
        console.error('Erro ao gerar relatório:', error);
        alert(`❌ Erro ao gerar relatório: ${error.message}\n\nVerifique o console para mais detalhes.`);

        const relatorioBasico = gerarRelatorioBasico(tipoRelatorio, numeroRelatorio, dataInicio, dataFinal, responsavel);
        alert('📄 Relatório básico gerado:\n\n' + relatorioBasico.substring(0, 500) + '...');

    } finally {
        loading.style.display = 'none';
    }
}

async function gerarRelatorioPedidos(dataInicio, dataFinal) {
    console.log('Gerando relatório de pedidos...');

    try {
        const response = await fetch(`${API_URL}?module=relatorios&action=gerar_relatorio_pedidos&data_inicio=${dataInicio}&data_final=${dataFinal}`);
        if (response.ok) {
            const data = await response.json();
            return data;
        }
    } catch (error) {
        console.warn('API de pedidos não disponível, usando dados locais');
    }

    const pedidosFiltrados = pedidos.filter(p => {
        return true;
    });

    return {
        total: pedidosFiltrados.length,
        totalVendas: pedidosFiltrados.reduce((sum, p) => sum + (parseFloat(p.total) || 0), 0).toFixed(2),
        pedidos: pedidosFiltrados.slice(0, 50),
        estatisticas: {
            entregues: pedidosFiltrados.filter(p => p.status === 'entregue').length,
            em_preparo: pedidosFiltrados.filter(p => p.status === 'preparo' || p.status === 'em_preparo').length,
            cancelados: pedidosFiltrados.filter(p => p.status === 'cancelado').length
        }
    };
}


async function gerarRelatorioEstoque() {
    console.log('Gerando relatório de estoque...');

    return {
        totalItens: estoque.length,
        itensCriticos: estoque.filter(i => i.status === "critico").length,
        itensOk: estoque.filter(i => i.status === "ok").length,
        itensMaximo: estoque.filter(i => i.status === "maximo").length,
        listaItens: estoque.map(item => ({
            nome: item.item,
            quantidade: item.quantidade,
            unidade: item.unidade,
            status: item.status,
            minimo: item.minimo,
            maximo: item.maximo
        }))
    };
}

async function gerarRelatorioCardapio() {
    console.log('Gerando relatório do cardápio...');

    return {
        totalItens: cardapio.length,
        disponiveis: cardapio.filter(i => i.disponivel).length,
        indisponiveis: cardapio.filter(i => !i.disponivel).length,
        porCategoria: {
            hamburgueres: cardapio.filter(i => i.categoria === 'hamburguer'),
            bebidas: cardapio.filter(i => i.categoria === 'bebida'),
            acompanhamentos: cardapio.filter(i => i.categoria === 'acompanhamento'),
            outros: cardapio.filter(i => !['hamburguer', 'bebida', 'acompanhamento'].includes(i.categoria))
        }
    };
}

async function gerarRelatorioFinanceiro(dataInicio, dataFinal) {
    console.log('Gerando relatório financeiro...');

    const pedidosFiltrados = pedidos;

    const totalVendas = pedidosFiltrados.reduce((sum, p) => sum + (parseFloat(p.total) || 0), 0);

    return {
        totalVendas: totalVendas.toFixed(2),
        totalPedidos: pedidosFiltrados.length,
        ticketMedio: (pedidosFiltrados.length > 0 ? totalVendas / pedidosFiltrados.length : 0).toFixed(2),
        pedidosPorStatus: {
            entregues: pedidosFiltrados.filter(p => p.status === 'entregue').length,
            cancelados: pedidosFiltrados.filter(p => p.status === 'cancelado').length,
            em_preparo: pedidosFiltrados.filter(p => p.status === 'preparo' || p.status === 'em_preparo').length
        }
    };
}

async function gerarRelatorioFuncionarios() {
    console.log('Gerando relatório de funcionários...');

    if (!funcionarios || funcionarios.length === 0) {
        return {
            total: 0,
            lista: []
        };
    }

    return {
        total: funcionarios.length,
        lista: funcionarios.map(f => ({
            id: f.id,
            nome: f.nome,
            cargo: f.cargo,
            telefone: f.telefone,
            email: f.email,
            status: f.status
        }))
    };
}

function formatarRelatorioFinal(tipo, dados, info) {
    const dataHoraCompleta = new Date().toLocaleString('pt-BR');

    let relatorio = `========================================\n`;
    relatorio += `        RELATÓRIO DE ${getNomeRelatorio(tipo).toUpperCase()}\n`;
    relatorio += `========================================\n\n`;

    relatorio += `📋 INFORMAÇÕES DO RELATÓRIO\n`;
    relatorio += `────────────────────────────────────────\n`;
    relatorio += `• Número: ${info.numero}\n`;
    relatorio += `• Tipo: ${getNomeRelatorio(tipo)}\n`;
    relatorio += `• Período: ${info.dataInicio} ${info.dataFinal !== info.dataInicio ? `a ${info.dataFinal}` : ''}\n`;
    relatorio += `• Horário: ${info.horario}\n`;
    relatorio += `• Responsável: ${info.responsavel}\n`;
    relatorio += `• Data de geração: ${info.dataGeracao}\n\n`;

    relatorio += `📊 ESTATÍSTICAS PRINCIPAIS\n`;
    relatorio += `────────────────────────────────────────\n`;

    if (dados.total !== undefined) relatorio += `• Total: ${dados.total}\n`;
    if (dados.totalVendas !== undefined) relatorio += `• Total em Vendas: R$ ${dados.totalVendas}\n`;
    if (dados.totalItens !== undefined) relatorio += `• Total de Itens: ${dados.totalItens}\n`;
    if (dados.disponiveis !== undefined) relatorio += `• Disponíveis: ${dados.disponiveis}\n`;
    if (dados.indisponiveis !== undefined) relatorio += `• Indisponíveis: ${dados.indisponiveis}\n`;
    if (dados.ticketMedio !== undefined) relatorio += `• Ticket Médio: R$ ${dados.ticketMedio}\n`;

    if (dados.estatisticas) {
        for (const [chave, valor] of Object.entries(dados.estatisticas)) {
            const nomeFormatado = chave.replace(/_/g, ' ')
                .replace(/\b\w/g, l => l.toUpperCase());
            relatorio += `• ${nomeFormatado}: ${valor}\n`;
        }
    }

    if (dados.pedidos && dados.pedidos.length > 0) {
        relatorio += `\n🛒 DETALHAMENTO DOS PEDIDOS\n`;
        relatorio += `────────────────────────────────────────\n`;

        dados.pedidos.slice(0, 20).forEach((pedido, index) => {
            relatorio += `${index + 1}. ${pedido.numero_pedido || '#' + pedido.id} - ${pedido.nome_cliente || 'Cliente'} - R$ ${parseFloat(pedido.total || 0).toFixed(2)} - ${pedido.status || 'N/A'}\n`;
        });

        if (dados.pedidos.length > 20) {
            relatorio += `... e mais ${dados.pedidos.length - 20} pedidos.\n`;
        }
    }

    if (dados.listaItens && dados.listaItens.length > 0) {
        relatorio += `\n📦 ITENS DO ESTOQUE\n`;
        relatorio += `────────────────────────────────────────\n`;

        dados.listaItens.forEach(item => {
            relatorio += `• ${item.nome}: ${item.quantidade} ${item.unidade} (${item.status})\n`;
        });
    }

    if (tipo === 'funcionarios') {
    relatorio += `Total de funcionários: ${dados.total}\n\n`;

    relatorio += `📋 LISTA DE FUNCIONÁRIOS\n`;
    relatorio += `────────────────────────────────────────\n`;

    dados.lista.forEach(f => {
        relatorio += `ID: ${f.id}\n`;
        relatorio += `Nome: ${f.nome}\n`;
        relatorio += `Cargo: ${f.cargo}\n`;
        relatorio += `Telefone: ${f.telefone || 'N/A'}\n`;
        relatorio += `Email: ${f.email || 'N/A'}\n`;
        relatorio += `Status: ${f.status || 'N/A'}\n`;
        relatorio += `----------------------------------------\n`;
    });
}

    relatorio += `\n========================================\n`;
    relatorio += `Gerado em: ${dataHoraCompleta}\n`;
    relatorio += `Sistema BurgerSystem\n`;
    relatorio += `========================================\n`;

    return relatorio;
}

function mostrarRelatorioNaTela(conteudo, numero, tipo) {
    const modalId = 'modal-relatorio-' + Date.now();
    const modal = document.createElement('div');

    modal.id = modalId;
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        z-index: 9999;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 20px;
    `;

    modal.innerHTML = `
        <div style="
            background: white;
            width: 90%;
            max-width: 800px;
            height: 80%;
            border-radius: 10px;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            box-shadow: 0 0 30px rgba(0,0,0,0.3);
        ">
            <div style="
                background: #c1121f;
                color: white;
                padding: 15px 20px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-weight: bold;
                font-size: 18px;
            ">
                <span>📊 ${getNomeRelatorio(tipo)} - ${numero}</span>
                <button onclick="document.getElementById('${modalId}').remove()" style="
                    background: none;
                    border: none;
                    color: white;
                    font-size: 24px;
                    cursor: pointer;
                    line-height: 1;
                ">✕</button>
            </div>
            
            <pre style="
                flex: 1;
                padding: 20px;
                margin: 0;
                overflow: auto;
                white-space: pre-wrap;
                font-family: monospace;
                font-size: 14px;
                background: #f9f9f9;
            ">${conteudo.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
            
            <div style="
                padding: 15px 20px;
                background: #f5f5f5;
                border-top: 1px solid #ddd;
                display: flex;
                justify-content: space-between;
                align-items: center;
            ">
                <div>
                    <button onclick="navigator.clipboard.writeText(\`${conteudo.replace(/`/g, '\\`')}\`).then(() => alert('✅ Copiado!'))" style="
                        padding: 8px 15px;
                        background: #6c757d;
                        color: white;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                        margin-right: 10px;
                    ">📋 Copiar</button>
                    
                    <button onclick="window.print()" style="
                        padding: 8px 15px;
                        background: #007bff;
                        color: white;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                    ">🖨️ Imprimir</button>
                </div>
                
                <button onclick="document.getElementById('${modalId}').remove()" style="
                    padding: 8px 15px;
                    background: #dc3545;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                ">✕ Fechar</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

function baixarRelatorioComoArquivo(conteudo, numero, tipo) {
    const blob = new Blob([conteudo], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');

    a.href = url;
    a.download = `relatorio-${numero}-${tipo}.txt`;
    a.style.display = 'none';

    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        alert(`✅ Relatório baixado com sucesso!\n\nArquivo: relatorio-${numero}-${tipo}.txt`);
    }, 100);
}

function copiarParaAreaTransferencia(conteudo) {
    navigator.clipboard.writeText(conteudo)
        .then(() => {
            alert('✅ Relatório copiado para área de transferência!');
        })
        .catch(err => {
            console.error('Erro ao copiar:', err);
            alert('❌ Não foi possível copiar. Tente baixar o arquivo.');
        });
}

function gerarRelatorioBasico(tipo, numero, dataInicio, dataFinal, responsavel) {
    return `
RELATÓRIO BÁSICO - ${getNomeRelatorio(tipo).toUpperCase()}
Número: ${numero}
Data: ${dataInicio} a ${dataFinal}
Responsável: ${responsavel}
Gerado em: ${new Date().toLocaleString('pt-BR')}

Este é um relatório básico gerado em modo offline.
Para relatórios completos, verifique a conexão com o servidor.
`;
}

document.addEventListener('DOMContentLoaded', function () {
    console.log('Inicializando sistema completo...');

    carregarTamanhoFonte();

    const btnSalvar = document.getElementById('btn-salvar');
    if (btnSalvar) {
        btnSalvar.addEventListener('click', salvarConfiguracoes);
        console.log('Event listener do botão salvar configurado');
    }

    configurarPreviewTempoReal();

    const btnResetar = document.getElementById('btn-redefinir');
    if (btnResetar) {
        btnResetar.addEventListener('click', resetarConfiguracoes);
    }

    carregarTemaSalvo();

    if (isPaginaRelatorios()) {
    console.log('Inicializando página de relatórios...');
    atualizarSelectTiposRelatorio();
    preencherDataHoraRelatorio();
    configurarMascarasDataRelatorio();

    // REMOVIDO o event listener duplicado do botão gerarRelatorio
    // O botão já tem onclick="gerarRelatorio()" no HTML, então não precisa de listener extra

    const btnLimparRelatorio = document.querySelector('#relatorios button[onclick*="limparFormularioRelatorio"]');
    if (btnLimparRelatorio) {
        btnLimparRelatorio.addEventListener('click', function (e) {
            e.preventDefault();
            limparFormularioRelatorio();
        });
    }
}

    carregarEstoqueDoBackend();
    carregarCardapioDoBackend();
    carregarPedidos();
    carregarTransacoes();
    inicializarAbas('.config-tab', '.config-content');
    inicializarAbas('.historico-tab', '.historico-content');
});

function visualizarRelatorioModal(texto, info) {
    const modal = document.createElement('div');
    modal.className = 'modal-relatorio-visual';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        z-index: 9999;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 20px;
    `;

    modal.innerHTML = `
        <div style="
            background: white;
            width: 90%;
            max-width: 800px;
            height: 80%;
            border-radius: 8px;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        ">
            <div style="
                background: #c1121f;
                color: white;
                padding: 15px;
                font-weight: bold;
                display: flex;
                justify-content: space-between;
                align-items: center;
            ">
                <span>📊 Relatório ${info.numero}</span>
                <button onclick="this.parentElement.parentElement.parentElement.remove()" style="
                    background: none;
                    border: none;
                    color: white;
                    font-size: 20px;
                    cursor: pointer;
                ">✕</button>
            </div>
            
            <pre style="
                flex: 1;
                padding: 20px;
                overflow: auto;
                margin: 0;
                white-space: pre-wrap;
                background: #f9f9f9;
                color: #000000;
            ">${texto.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
            
            <div style="
                padding: 15px;
                background: #f5f5f5;
                border-top: 1px solid #ddd;
                text-align: center;
            ">
                <button onclick="navigator.clipboard.writeText(\`${texto.replace(/`/g, '\\`')}\`).then(() => alert('Copiado!'))" style="
                    padding: 8px 15px;
                    margin-right: 10px;
                    background: #6c757d;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                ">📋 Copiar</button>
                
                <button onclick="window.print()" style="
                    padding: 8px 15px;
                    margin-right: 10px;
                    background: #007bff;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                ">🖨️ Imprimir</button>
                
                <button onclick="this.parentElement.parentElement.parentElement.remove()" style="
                    padding: 8px 15px;
                    background: #dc3545;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                ">✕ Fechar</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

function gerarTextoRelatorioSimples(tipo, dados, info) {
    let texto = `RELATÓRIO DE ${getNomeRelatorio(tipo).toUpperCase()}\n`;
    texto += '='.repeat(50) + '\n\n';
    texto += `Número: ${info.numero}\n`;
    texto += `Período: ${info.dataInicio} ${info.dataFinal !== info.dataInicio ? `a ${info.dataFinal}` : ''}\n`;
    texto += `Responsável: ${info.responsavel}\n`;
    texto += `Gerado em: ${info.geradoEm}\n\n`;

    if (dados.estatisticas) {
        texto += 'ESTATÍSTICAS:\n';
        for (const [key, value] of Object.entries(dados.estatisticas)) {
            texto += `- ${key.replace(/_/g, ' ')}: ${value}\n`;
        }
        texto += '\n';
    }

    if (tipo === 'pedidos' && dados.pedidos) {
        texto += 'PEDIDOS:\n';
        dados.pedidos.forEach(pedido => {
            texto += `- ${pedido.numero_pedido}: ${pedido.nome_cliente} - R$ ${pedido.total} (${pedido.status})\n`;
        });
    }

    texto += '\n' + '='.repeat(50) + '\n';
    texto += `Gerado pelo BurgerSystem\n`;

    return texto;
}

function gerarDadosLocaisParaRelatorio(tipo, dataInicio, dataFinal) {
    console.log(`Gerando dados locais para relatório: ${tipo}`);

    switch (tipo) {
        case 'pedidos':
            return {
                estatisticas: {
                    total_pedidos: pedidos.length,
                    total_vendas: pedidos.reduce((sum, p) => sum + (parseFloat(p.total) || 0), 0).toFixed(2),
                    pedidos_entregues: pedidos.filter(p => p.status === 'entregue').length,
                    pedidos_preparo: pedidos.filter(p => p.status === 'preparo' || p.status === 'em_preparo').length,
                    pedidos_cancelados: pedidos.filter(p => p.status === 'cancelado').length,
                    pedidos_delivery: pedidos.filter(p => p.tipo === 'Delivery').length,
                    pedidos_local: pedidos.filter(p => p.tipo === 'Local').length,
                    ticket_medio: (pedidos.length > 0 ?
                        pedidos.reduce((sum, p) => sum + (parseFloat(p.total) || 0), 0) / pedidos.length : 0).toFixed(2)
                },
                pedidos: pedidos.slice(0, 20).map(p => ({
                    numero_pedido: p.numero_pedido || '#' + p.id,
                    nome_cliente: p.nome_cliente || 'Cliente não informado',
                    data_pedido: p.data_pedido || dataInicio,
                    horario_pedido: p.horario_pedido || new Date().toLocaleTimeString('pt-BR'),
                    total: parseFloat(p.total || 0).toFixed(2),
                    status: p.status || 'pendente',
                    tipo: p.tipo || 'Local'
                }))
            };

        case 'estoque':
            return {
                estatisticas: {
                    total_itens: estoque.length,
                    itens_criticos: estoque.filter(i => i.status === "critico").length,
                    itens_ok: estoque.filter(i => i.status === "ok").length,
                    itens_maximo: estoque.filter(i => i.status === "maximo").length
                },
                estoque: estoque.map(item => ({
                    item: item.item,
                    quantidade: item.quantidade,
                    unidade: item.unidade,
                    minimo: item.minimo,
                    maximo: item.maximo,
                    status: item.status
                }))
            };

        case 'cardapio':
            return {
                estatisticas: {
                    total_itens: cardapio.length,
                    itens_disponiveis: cardapio.filter(i => i.disponivel).length,
                    itens_indisponiveis: cardapio.filter(i => !i.disponivel).length,
                    preco_medio: (cardapio.length > 0 ?
                        cardapio.reduce((sum, i) => sum + (parseFloat(i.preco) || 0), 0) / cardapio.length : 0).toFixed(2)
                },
                por_categoria: {
                    hamburgueres: cardapio.filter(i => i.categoria === 'hamburguer').slice(0, 10),
                    bebidas: cardapio.filter(i => i.categoria === 'bebida').slice(0, 10),
                    acompanhamentos: cardapio.filter(i => i.categoria === 'acompanhamento').slice(0, 10)
                }
            };

        case 'financeiro':
            const totalVendas = pedidos.reduce((sum, p) => sum + (parseFloat(p.total) || 0), 0);
            return {
                estatisticas: {
                    total_vendas: totalVendas.toFixed(2),
                    total_pedidos: pedidos.length,
                    pedidos_entregues: pedidos.filter(p => p.status === 'entregue').length,
                    pedidos_cancelados: pedidos.filter(p => p.status === 'cancelado').length,
                    ticket_medio: (pedidos.length > 0 ? totalVendas / pedidos.length : 0).toFixed(2)
                }
            };

        default:
            return {
                mensagem: 'Tipo de relatório não suportado em modo local',
                estatisticas: {},
                dados: []
            };
    }
}

function formatarRelatorioParaVisualizacao(tipo, dados, info) {
    const dataHora = new Date().toLocaleString('pt-BR');

    let textoFormatado = '';
    let htmlFormatado = '';

    const cabecalho = `📊 RELATÓRIO DE ${getNomeRelatorio(tipo).toUpperCase()}\n` +
        `Número: ${info.numero}\n` +
        `Período: ${info.dataInicio} ${info.dataFinal !== info.dataInicio ? `a ${info.dataFinal}` : ''}\n` +
        `Responsável: ${info.responsavel}\n` +
        `Data de Geração: ${info.geradoEm}\n` +
        `${'='.repeat(60)}\n\n`;

    textoFormatado += cabecalho;
    htmlFormatado += `<h1>📊 Relatório de ${getNomeRelatorio(tipo)}</h1>` +
        `<div class="info-relatorio">` +
        `<p><strong>Número:</strong> ${info.numero}</p>` +
        `<p><strong>Período:</strong> ${info.dataInicio} ${info.dataFinal !== info.dataInicio ? `a ${info.dataFinal}` : ''}</p>` +
        `<p><strong>Responsável:</strong> ${info.responsavel}</p>` +
        `<p><strong>Data de Geração:</strong> ${info.geradoEm}</p>` +
        `</div><hr>`;

    if (dados.estatisticas) {
        textoFormatado += '📈 ESTATÍSTICAS\n';
        htmlFormatado += '<h2>📈 Estatísticas</h2><ul>';

        for (const [chave, valor] of Object.entries(dados.estatisticas)) {
            const nomeFormatado = chave.replace(/_/g, ' ')
                .replace(/\b\w/g, l => l.toUpperCase());
            textoFormatado += `• ${nomeFormatado}: ${valor}\n`;
            htmlFormatado += `<li><strong>${nomeFormatado}:</strong> ${valor}</li>`;
        }

        textoFormatado += '\n';
        htmlFormatado += '</ul><hr>';
    }

    if (dados.pedidos && dados.pedidos.length > 0) {
        textoFormatado += '🛒 PEDIDOS DETALHADOS\n';
        htmlFormatado += '<h2>🛒 Pedidos Detalhados</h2><table class="tabela-relatorio"><thead><tr><th>Nº</th><th>Cliente</th><th>Data</th><th>Total</th><th>Status</th></tr></thead><tbody>';

        dados.pedidos.forEach(pedido => {
            textoFormatado += `\nPedido ${pedido.numero_pedido}\n`;
            textoFormatado += `Cliente: ${pedido.nome_cliente}\n`;
            textoFormatado += `Data: ${pedido.data_pedido} ${pedido.horario_pedido}\n`;
            textoFormatado += `Total: R$ ${pedido.total}\n`;
            textoFormatado += `Status: ${pedido.status}\n`;
            textoFormatado += `${'-'.repeat(40)}\n`;

            htmlFormatado += `<tr>` +
                `<td>${pedido.numero_pedido}</td>` +
                `<td>${pedido.nome_cliente}</td>` +
                `<td>${pedido.data_pedido} ${pedido.horario_pedido}</td>` +
                `<td>R$ ${pedido.total}</td>` +
                `<td><span class="badge badge-${pedido.status === 'entregue' ? 'success' : pedido.status === 'preparo' ? 'warning' : 'secondary'}">${pedido.status}</span></td>` +
                `</tr>`;
        });

        htmlFormatado += '</tbody></table>';
    }

    if (dados.estoque && dados.estoque.length > 0) {
        textoFormatado += '\n📦 ITENS DO ESTOQUE\n';
        htmlFormatado += '<h2>📦 Itens do Estoque</h2><table class="tabela-relatorio"><thead><tr><th>Item</th><th>Quantidade</th><th>Status</th></tr></thead><tbody>';

        dados.estoque.forEach(item => {
            textoFormatado += `\n${item.item}\n`;
            textoFormatado += `Quantidade: ${item.quantidade} ${item.unidade}\n`;
            textoFormatado += `Status: ${item.status}\n`;
            textoFormatado += `${'-'.repeat(30)}\n`;

            htmlFormatado += `<tr>` +
                `<td>${item.item}</td>` +
                `<td>${item.quantidade} ${item.unidade}</td>` +
                `<td><span class="badge badge-${item.status === 'critico' ? 'danger' : item.status === 'ok' ? 'success' : 'warning'}">${item.status}</span></td>` +
                `</tr>`;
        });

        htmlFormatado += '</tbody></table>';
    }

    if (dados.por_categoria) {
        for (const [categoria, itens] of Object.entries(dados.por_categoria)) {
            if (itens && itens.length > 0) {
                const categoriaNome = categoria.charAt(0).toUpperCase() + categoria.slice(1);
                textoFormatado += `\n🍽️ ${categoriaNome.toUpperCase()}\n`;
                htmlFormatado += `<h2>🍽️ ${categoriaNome}</h2><ul>`;

                itens.forEach(item => {
                    textoFormatado += `\n${item.nome}\n`;
                    textoFormatado += `Preço: R$ ${parseFloat(item.preco || 0).toFixed(2)}\n`;
                    textoFormatado += `Disponível: ${item.disponivel ? 'Sim' : 'Não'}\n`;

                    htmlFormatado += `<li>` +
                        `<strong>${item.nome}</strong> - R$ ${parseFloat(item.preco || 0).toFixed(2)}` +
                        `<span class="badge ${item.disponivel ? 'badge-success' : 'badge-danger'} ml-2">${item.disponivel ? 'Disponível' : 'Indisponível'}</span>` +
                        `</li>`;
                });

                htmlFormatado += '</ul>';
            }
        }
    }

    const rodape = `\n${'='.repeat(60)}\n` +
        `Relatório gerado automaticamente pelo BurgerSystem\n` +
        `Data/Hora: ${dataHora}\n` +
        `© ${new Date().getFullYear()} - Todos os direitos reservados\n`;

    textoFormatado += rodape;
    htmlFormatado += `<hr><div class="rodape-relatorio">` +
        `<p>Relatório gerado automaticamente pelo BurgerSystem</p>` +
        `<p>Data/Hora: ${dataHora}</p>` +
        `<p>© ${new Date().getFullYear()} - Todos os direitos reservados</p>` +
        `</div>`;

    return {
        textoFormatado: textoFormatado,
        htmlFormatado: htmlFormatado,
        dadosBrutos: dados
    };
}

function mostrarRelatorioVisualFormatado(tipo, conteudo, info) {
    const novaJanela = window.open('', '_blank', 'width=1000,height=700,scrollbars=yes');

    novaJanela.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Relatório ${info.numero} - ${getNomeRelatorio(tipo)}</title>
            <meta charset="UTF-8">
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 20px;
                    line-height: 1.6;
                    color: #333;
                }
                .container {
                    max-width: 900px;
                    margin: 0 auto;
                    padding: 20px;
                }
                .header-relatorio {
                    text-align: center;
                    border-bottom: 2px solid #c1121f;
                    padding-bottom: 20px;
                    margin-bottom: 30px;
                }
                .info-relatorio {
                    background: #f8f9fa;
                    padding: 15px;
                    border-radius: 8px;
                    margin: 20px 0;
                }
                .tabela-relatorio {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 20px 0;
                }
                .tabela-relatorio th {
                    background-color: #c1121f;
                    color: white;
                    padding: 12px;
                    text-align: left;
                }
                .tabela-relatorio td {
                    padding: 10px;
                    border: 1px solid #ddd;
                }
                .tabela-relatorio tr:nth-child(even) {
                    background-color: #f9f9f9;
                }
                .badge {
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 12px;
                    font-weight: bold;
                }
                .badge-success { background: #28a745; color: white; }
                .badge-warning { background: #ffc107; color: #212529; }
                .badge-danger { background: #dc3545; color: white; }
                .badge-secondary { background: #6c757d; color: white; }
                .rodape-relatorio {
                    margin-top: 40px;
                    padding-top: 20px;
                    border-top: 1px solid #ddd;
                    text-align: center;
                    color: #666;
                    font-size: 14px;
                }
                .acoes-relatorio {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    z-index: 1000;
                }
                .btn-acao {
                    padding: 10px 20px;
                    margin-left: 10px;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    font-weight: bold;
                }
                .btn-print { background: #007bff; color: white; }
                .btn-close { background: #6c757d; color: white; }
                .btn-download { background: #28a745; color: white; }
                h1 { color: #c1121f; }
                h2 { color: #495057; border-bottom: 1px solid #eee; padding-bottom: 10px; }
                ul { padding-left: 20px; }
                li { margin-bottom: 8px; }
                .ml-2 { margin-left: 10px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header-relatorio">
                    <h1>📊 Relatório de ${getNomeRelatorio(tipo)}</h1>
                    <div class="info-relatorio">
                        <p><strong>Número do Relatório:</strong> ${info.numero}</p>
                        <p><strong>Período Analisado:</strong> ${info.dataInicio} ${info.dataFinal !== info.dataInicio ? `a ${info.dataFinal}` : ''}</p>
                        <p><strong>Responsável:</strong> ${info.responsavel}</p>
                        <p><strong>Gerado em:</strong> ${info.geradoEm}</p>
                    </div>
                </div>
                
                ${conteudo.htmlFormatado}
            </div>
            
            <div class="acoes-relatorio">
                <button class="btn-acao btn-download" onclick="window.print()">🖨️ Imprimir</button>
                <button class="btn-acao btn-download" onclick="downloadRelatorio()">📥 Download</button>
                <button class="btn-acao btn-close" onclick="window.close()">✕ Fechar</button>
            </div>
            
            <script>
                function downloadRelatorio() {
                    const element = document.createElement('a');
                    const text = \`${conteudo.textoFormatado.replace(/\n/g, '\\n').replace(/'/g, "\\'")}\`;
                    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
                    element.setAttribute('download', 'relatorio-${info.numero}.txt');
                    element.style.display = 'none';
                    document.body.appendChild(element);
                    element.click();
                    document.body.removeChild(element);
                }
            </script>
        </body>
        </html>
    `);

    novaJanela.document.close();
}

function gerarConteudoBasicoLocal(tipo, numero, dataInicio, dataFinal, responsavel) {
    const dataHora = new Date().toLocaleString('pt-BR');

    let conteudo = `📊 RELATÓRIO BÁSICO - ${getNomeRelatorio(tipo).toUpperCase()}\n`;
    conteudo += `${'='.repeat(60)}\n`;
    conteudo += `Número: ${numero}\n`;
    conteudo += `Data: ${dataInicio} ${dataFinal !== dataInicio ? `a ${dataFinal}` : ''}\n`;
    conteudo += `Responsável: ${responsavel}\n`;
    conteudo += `Gerado em: ${dataHora}\n`;
    conteudo += `${'='.repeat(60)}\n\n`;
    conteudo += `⚠️ AVISO: Este relatório foi gerado em modo offline com dados limitados.\n`;
    conteudo += `Para obter informações completas, conecte-se ao servidor.\n\n`;

    switch (tipo) {
        case 'pedidos':
            conteudo += `📋 RESUMO DE PEDIDOS\n`;
            conteudo += `• Total de Pedidos: ${pedidos.length}\n`;
            conteudo += `• Pedidos Entregues: ${pedidos.filter(p => p.status === 'entregue').length}\n`;
            conteudo += `• Pedidos em Preparo: ${pedidos.filter(p => p.status === 'preparo' || p.status === 'em_preparo').length}\n\n`;

            if (pedidos.length > 0) {
                conteudo += `ÚLTIMOS 5 PEDIDOS:\n`;
                pedidos.slice(0, 5).forEach((p, i) => {
                    conteudo += `${i + 1}. ${p.nome_cliente || 'Cliente'} - R$ ${parseFloat(p.total || 0).toFixed(2)} - ${p.status || 'pendente'}\n`;
                });
            }
            break;

        case 'estoque':
            const criticos = estoque.filter(i => i.status === "critico");
            conteudo += `📦 SITUAÇÃO DO ESTOQUE\n`;
            conteudo += `• Total de Itens: ${estoque.length}\n`;
            conteudo += `• Itens Críticos: ${criticos.length}\n\n`;

            if (criticos.length > 0) {
                conteudo += `ITENS COM ESTOQUE CRÍTICO:\n`;
                criticos.forEach(item => {
                    conteudo += `• ${item.item}: ${item.quantidade} ${item.unidade} (mínimo: ${item.minimo})\n`;
                });
            }
            break;

        default:
            conteudo += `Informações detalhadas não disponíveis para este tipo de relatório em modo offline.\n`;
    }

    conteudo += `\n${'='.repeat(60)}\n`;
    conteudo += `Relatório básico gerado pelo BurgerSystem\n`;
    conteudo += `${dataHora}\n`;

    return conteudo;
}

function gerarConteudoRelatorioSimples(tipo, dados, info) {
    const texto = `
========================================
        RELATÓRIO DE ${getNomeRelatorio(tipo).toUpperCase()}
========================================

INFORMAÇÕES DO RELATÓRIO:
- Número: ${info.numero}
- Tipo: ${getNomeRelatorio(info.tipo)}
- Período: ${info.dataInicio} a ${info.dataFinal}
- Horário: ${info.horario || 'Não informado'}
- Responsável: ${info.responsavel}
- Data de geração: ${info.dataGeracao}

DADOS:
${JSON.stringify(dados.data || dados, null, 2)}

========================================
        FIM DO RELATÓRIO
========================================
`;

    return {
        texto: texto,
        info: info
    };
}

function mostrarRelatorioVisual(tipo, dados, info) {
    const conteudo = `
        <div style="padding: 20px; max-width: 800px; margin: 0 auto;">
            <h3>📊 Relatório de ${getNomeRelatorio(tipo)}</h3>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
                <p><strong>Número:</strong> ${info.numero}</p>
                <p><strong>Período:</strong> ${info.dataInicio} a ${info.dataFinal}</p>
                <p><strong>Responsável:</strong> ${info.responsavel}</p>
                <p><strong>Data de geração:</strong> ${info.dataGeracao}</p>
            </div>
            <pre style="background: #f5f5f5; padding: 15px; border-radius: 5px; overflow: auto; max-height: 400px;">
${JSON.stringify(dados.data || dados, null, 2)}
            </pre>
        </div>
    `;

    const novaJanela = window.open('', '_blank', 'width=900,height=600');
    novaJanela.document.write(`
        <html>
            <head>
                <title>Relatório ${info.numero}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    pre { white-space: pre-wrap; }
                </style>
            </head>
            <body>
                ${conteudo}
                <div style="text-align: center; margin-top: 20px;">
                    <button onclick="window.print()" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">
                        🖨️ Imprimir Relatório
                    </button>
                    <button onclick="window.close()" style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer; margin-left: 10px;">
                        ✕ Fechar
                    </button>
                </div>
            </body>
        </html>
    `);
    novaJanela.document.close();
}

function criarLoading() {
    let loading = document.getElementById('loading-relatorio');
    if (loading) return loading;

    loading = document.createElement('div');
    loading.id = 'loading-relatorio';
    loading.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: none;
        justify-content: center;
        align-items: center;
        z-index: 9999;
    `;
    loading.innerHTML = `
        <div style="background: white; padding: 30px; border-radius: 10px; text-align: center;">
            <div class="spinner-border text-primary" style="width: 3rem; height: 3rem;" role="status">
                <span class="visually-hidden">Carregando...</span>
            </div>
            <p class="mt-3" style="font-weight: bold;">Gerando relatório...</p>
        </div>
    `;
    document.body.appendChild(loading);
    return loading;
}

function getNomeRelatorio(tipo) {
    const nomes = {
        'pedidos': 'Pedidos',
        'estoque': 'Estoque',
        'cardapio': 'Cardápio',
        'financeiro': 'Financeiro',
        'funcionarios': 'Funcionários'
    };
    return nomes[tipo] || tipo;
}

function gerarConteudoRelatorioBD(tipo, dados, info) {
    const dataHora = new Date().toLocaleString('pt-BR');
    let cabecalho = `📊 RELATÓRIO DE ${getNomeRelatorio(tipo).toUpperCase()}\n`;
    cabecalho += `Número: ${info.numero}\n`;
    cabecalho += `Tipo: ${getNomeRelatorio(info.tipo)}\n`;
    cabecalho += `Período: ${info.dataInicio} ${info.dataFinal !== info.dataInicio ? `a ${info.dataFinal}` : ''}\n`;
    cabecalho += `Responsável: ${info.responsavel}\n`;
    cabecalho += `Data de Geração: ${dataHora}\n`;
    cabecalho += '='.repeat(60) + '\n\n';

    let corpo = '';
    let estatisticas = dados.estatisticas || {};

    switch (tipo) {
        case 'pedidos':
            corpo = `📈 RESUMO DE VENDAS\n`;
            corpo += `• Total de Pedidos: ${estatisticas.total_pedidos || 0}\n`;
            corpo += `• Total em Vendas: R$ ${estatisticas.total_vendas || '0,00'}\n`;
            corpo += `• Pedidos Entregues: ${estatisticas.pedidos_entregues || 0}\n`;
            corpo += `• Pedidos em Preparo: ${estatisticas.pedidos_preparo || 0}\n`;
            corpo += `• Pedidos Cancelados: ${estatisticas.pedidos_cancelados || 0}\n`;
            corpo += `• Pedidos Delivery: ${estatisticas.pedidos_delivery || 0}\n`;
            corpo += `• Pedidos Local: ${estatisticas.pedidos_local || 0}\n`;
            corpo += `• Ticket Médio: R$ ${estatisticas.ticket_medio || '0,00'}\n\n`;

            if (estatisticas.forma_pagamento) {
                corpo += `💳 FORMAS DE PAGAMENTO\n`;
                for (const [forma, valor] of Object.entries(estatisticas.forma_pagamento)) {
                    corpo += `  ${forma}: R$ ${parseFloat(valor).toFixed(2)}\n`;
                }
                corpo += '\n';
            }

            corpo += `🛒 DETALHAMENTO DOS PEDIDOS\n`;
            corpo += '='.repeat(60) + '\n';

            if (dados.pedidos && dados.pedidos.length > 0) {
                dados.pedidos.forEach((pedido, index) => {
                    corpo += `\nPedido #${pedido.numero_pedido || pedido.id}\n`;
                    corpo += `Cliente: ${pedido.nome_cliente || 'N/A'}\n`;
                    corpo += `Telefone: ${pedido.telefone_cliente || 'N/A'}\n`;
                    corpo += `Data: ${pedido.data_pedido || ''} ${pedido.horario_pedido || ''}\n`;
                    corpo += `Tipo: ${pedido.tipo || ''} | Status: ${pedido.status || ''}\n`;
                    corpo += `Funcionário: ${pedido.funcionario_nome || 'N/A'}\n`;
                    corpo += `Total: R$ ${parseFloat(pedido.total || 0).toFixed(2)}\n`;
                    corpo += `Pagamento: ${pedido.forma_pagamento || 'dinheiro'}\n`;
                    corpo += `Itens: ${pedido.itens || pedido.total_itens + ' itens'}\n`;
                    corpo += `Observação: ${pedido.observacao || 'Nenhuma'}\n`;
                    if (pedido.tipo === 'Delivery' && pedido.rua) {
                        corpo += `Endereço: ${pedido.rua}, ${pedido.numero_endereco} - ${pedido.bairro}, ${pedido.cidade}-${pedido.estado}\n`;
                    }
                    corpo += '-'.repeat(40) + '\n';
                });
            } else {
                corpo += 'Nenhum pedido encontrado no período.\n';
            }
            break;

        case 'estoque':
            corpo = `📦 SITUAÇÃO DO ESTOQUE\n`;
            corpo += `• Total de Itens: ${estatisticas.total_itens || 0}\n`;
            corpo += `• Itens Críticos: ${estatisticas.itens_criticos || 0}\n`;
            corpo += `• Itens em Alerta: ${estatisticas.itens_alerta || 0}\n`;
            corpo += `• Itens OK: ${estatisticas.itens_ok || 0}\n`;
            corpo += `• Itens no Máximo: ${estatisticas.itens_maximo || 0}\n`;
            corpo += `• Valor Total do Estoque: R$ ${estatisticas.valor_total_estoque || '0,00'}\n`;
            corpo += `• Itens com Estoque Baixo: ${estatisticas.itens_baixo_estoque || 0}\n`;
            corpo += `• Itens com Fornecedor: ${estatisticas.itens_com_fornecedor || 0}\n\n`;

            corpo += `📋 LISTA DE ITENS DO ESTOQUE\n`;
            corpo += '='.repeat(60) + '\n';

            if (dados.estoque && dados.estoque.length > 0) {
                dados.estoque.forEach(item => {
                    corpo += `\n${item.item}\n`;
                    corpo += `Descrição: ${item.descricao || 'N/A'}\n`;
                    corpo += `Quantidade: ${item.quantidade} ${item.unidade}\n`;
                    corpo += `Mínimo: ${item.minimo} | Máximo: ${item.maximo}\n`;
                    corpo += `Status: ${item.status_calculado || item.status || 'N/A'} (${item.percentual || 0}%)\n`;
                    corpo += `Custo Unitário: R$ ${parseFloat(item.custo_unitario || 0).toFixed(2)}\n`;
                    corpo += `Valor Total: R$ ${parseFloat(item.valor_total || 0).toFixed(2)}\n`;
                    corpo += `Fornecedor: ${item.fornecedor_nome || 'N/A'}\n`;
                    corpo += `Última Compra: ${item.data_ultima_compra || 'N/A'}\n`;
                    corpo += '-'.repeat(40) + '\n';
                });
            } else {
                corpo += 'Nenhum item no estoque.\n';
            }

            if (dados.movimentacoes && dados.movimentacoes.length > 0) {
                corpo += `\n📊 MOVIMENTAÇÕES DO ESTOQUE\n`;
                corpo += '='.repeat(60) + '\n';
                dados.movimentacoes.forEach(mov => {
                    corpo += `\n${mov.estoque_item || 'Item'}\n`;
                    corpo += `Tipo: ${mov.tipo} | Motivo: ${mov.motivo}\n`;
                    corpo += `Quantidade: ${mov.quantidade} (Anterior: ${mov.quantidade_anterior}, Atual: ${mov.quantidade_atual})\n`;
                    corpo += `Funcionário: ${mov.funcionario_nome || 'N/A'}\n`;
                    corpo += `Data: ${new Date(mov.data_movimentacao).toLocaleString()}\n`;
                    corpo += `Observação: ${mov.observacao || 'Nenhuma'}\n`;
                });
            }
            break;

        case 'cardapio':
            corpo = `🍔 CARDÁPIO COMPLETO\n`;
            corpo += `• Total de Itens: ${estatisticas.total_itens || 0}\n`;
            corpo += `• Itens Disponíveis: ${estatisticas.itens_disponiveis || 0}\n`;
            corpo += `• Itens Indisponíveis: ${estatisticas.itens_indisponiveis || 0}\n`;
            corpo += `• Disponibilidade: ${estatisticas.percentual_disponivel || 0}%\n`;
            corpo += `• Preço Médio: R$ ${estatisticas.preco_medio || '0,00'}\n`;
            corpo += `• Lucro Potencial Total: R$ ${estatisticas.lucro_potencial_total || '0,00'}\n`;
            corpo += `• Itens com Ingredientes: ${estatisticas.itens_com_ingredientes || 0}\n\n`;

            if (dados.por_categoria) {
                for (const [categoria, dadosCategoria] of Object.entries(dados.por_categoria)) {
                    corpo += `${categoria.toUpperCase()} (${dadosCategoria.total} itens)\n`;
                    corpo += `  Disponíveis: ${dadosCategoria.disponiveis} | Indisponíveis: ${dadosCategoria.indisponiveis}\n`;
                    corpo += '-'.repeat(40) + '\n';

                    dadosCategoria.itens.forEach(item => {
                        corpo += `${item.disponivel == 1 ? '✅' : '❌'} ${item.nome}\n`;
                        corpo += `   Preço: R$ ${parseFloat(item.preco || 0).toFixed(2)}\n`;
                        corpo += `   Custo: R$ ${parseFloat(item.custo_estimado || 0).toFixed(2)}\n`;
                        corpo += `   Lucro: R$ ${parseFloat(item.lucro_potencial || 0).toFixed(2)} (${item.margem_lucro || 0}%)\n`;
                        corpo += `   Tempo: ${item.tempo_preparo_estimado || 15} min\n`;
                        corpo += `   Ingredientes: ${item.total_ingredientes || 0}\n`;
                        if (item.descricao) corpo += `   Descrição: ${item.descricao}\n`;
                        if (item.motivo_indisponibilidade) corpo += `   Motivo Indisponibilidade: ${item.motivo_indisponibilidade}\n`;
                        corpo += '\n';
                    });
                }
            }

            if (dados.ingredientes && dados.ingredientes.length > 0) {
                corpo += `\n🧂 INGREDIENTES UTILIZADOS\n`;
                corpo += '='.repeat(60) + '\n';

                const ingredientesPorItem = {};
                dados.ingredientes.forEach(ing => {
                    if (!ingredientesPorItem[ing.cardapio_nome]) {
                        ingredientesPorItem[ing.cardapio_nome] = [];
                    }
                    ingredientesPorItem[ing.cardapio_nome].push(ing);
                });

                for (const [itemCardapio, ings] of Object.entries(ingredientesPorItem)) {
                    corpo += `\n${itemCardapio}:\n`;
                    ings.forEach(ing => {
                        corpo += `  - ${ing.estoque_item}: ${ing.quantidade_utilizada} ${ing.estoque_unidade || ing.unidade}\n`;
                    });
                }
            }
            break;

        case 'financeiro':
            corpo = `💰 RELATÓRIO FINANCEIRO\n`;
            corpo += `• Período: ${estatisticas.periodo || 'N/A'}\n`;
            corpo += `• Total de Vendas: R$ ${estatisticas.total_vendas || '0,00'}\n`;
            corpo += `• Total de Pedidos: ${estatisticas.total_pedidos || 0}\n`;
            corpo += `• Pedidos Entregues: ${estatisticas.pedidos_entregues || 0}\n`;
            corpo += `• Taxa de Cancelamento: ${estatisticas.taxa_cancelamento || '0%'}\n`;
            corpo += `• Ticket Médio: R$ ${estatisticas.ticket_medio || '0,00'}\n`;
            corpo += `• Total de Entradas: R$ ${estatisticas.total_entradas || '0,00'}\n`;
            corpo += `• Total de Saídas: R$ ${estatisticas.total_saidas || '0,00'}\n`;
            corpo += `• Total de Salários: R$ ${estatisticas.total_salarios || '0,00'}\n`;
            corpo += `• Lucro Bruto: R$ ${estatisticas.lucro_bruto || '0,00'}\n`;
            corpo += `• Margem de Lucro: ${estatisticas.margem_lucro || '0%'}\n`;
            corpo += `• Dias com Vendas: ${estatisticas.dias_com_vendas || 0}\n\n`;

            if (dados.pagamentos_estatisticas && dados.pagamentos_estatisticas.length > 0) {
                corpo += `💳 DISTRIBUIÇÃO POR FORMA DE PAGAMENTO\n`;
                dados.pagamentos_estatisticas.forEach(pag => {
                    corpo += `  ${pag.forma_pagamento}: ${pag.total_pedidos} pedidos - R$ ${parseFloat(pag.total_valor || 0).toFixed(2)}\n`;
                });
                corpo += '\n';
            }

            if (dados.dados_financeiros && dados.dados_financeiros.length > 0) {
                corpo += `📅 VENDAS POR DIA\n`;
                corpo += '='.repeat(60) + '\n';

                dados.dados_financeiros.forEach(dia => {
                    corpo += `\n${dia.data}\n`;
                    corpo += `Pedidos: ${dia.total_pedidos || 0}\n`;
                    corpo += `Vendas: R$ ${parseFloat(dia.total_vendas || 0).toFixed(2)}\n`;
                    corpo += `Ticket Médio: R$ ${parseFloat(dia.ticket_medio || 0).toFixed(2)}\n`;
                    corpo += `Entregues: ${dia.pedidos_entregues || 0}\n`;
                    corpo += `Formas de Pagamento: ${dia.formas_pagamento || 'N/A'}\n`;
                });
            }


            if (dados.entradas && dados.entradas.length > 0) {
                corpo += `\n💰 ENTRADAS DETALHADAS\n`;
                corpo += '='.repeat(60) + '\n';

                dados.entradas.forEach(entrada => {
                    corpo += `\n${entrada.descricao || 'Entrada'}\n`;
                    corpo += `Data: ${entrada.data} ${entrada.horario}\n`;
                    corpo += `Valor: R$ ${parseFloat(entrada.valor || 0).toFixed(2)}\n`;
                    corpo += `Categoria: ${entrada.categoria || 'N/A'}\n`;
                    corpo += `Forma Pagamento: ${entrada.forma_pagamento || 'N/A'}\n`;
                    corpo += `Funcionário: ${entrada.funcionario_nome || 'N/A'}\n`;
                    if (entrada.numero_pedido) corpo += `Pedido: ${entrada.numero_pedido}\n`;
                });
            }

            if (dados.saidas && dados.saidas.length > 0) {
                corpo += `\n📝 SAÍDAS DETALHADAS\n`;
                corpo += '='.repeat(60) + '\n';

                dados.saidas.forEach(saida => {
                    corpo += `\n${saida.descricao || 'Saída'}\n`;
                    corpo += `Data: ${saida.data} ${saida.horario}\n`;
                    corpo += `Valor: R$ ${parseFloat(saida.valor || 0).toFixed(2)}\n`;
                    corpo += `Categoria: ${saida.categoria || 'N/A'}\n`;
                    corpo += `Funcionário: ${saida.funcionario_nome || 'N/A'}\n`;
                });
            }

            if (dados.salarios && dados.salarios.length > 0) {
                corpo += `\n👥 FOLHA DE PAGAMENTO\n`;
                corpo += '='.repeat(60) + '\n';

                dados.salarios.forEach(salario => {
                    corpo += `\n${salario.funcionario_nome || 'Funcionário'}\n`;
                    corpo += `Data: ${salario.data}\n`;
                    corpo += `Valor: R$ ${parseFloat(salario.valor || 0).toFixed(2)}\n`;
                    corpo += `Descrição: ${salario.descricao || 'Salário'}\n`;
                });
            }
            break;

        case 'funcionarios':
            corpo = `👥 RELATÓRIO DE FUNCIONÁRIOS\n`;
            corpo += `• Total de Funcionários: ${estatisticas.total_funcionarios || 0}\n`;
            corpo += `• Funcionários Ativos: ${estatisticas.funcionarios_ativos || 0}\n`;
            corpo += `• Funcionários Inativos: ${estatisticas.funcionarios_inativos || 0}\n`;
            corpo += `• Total de Salários: R$ ${estatisticas.total_salarios || '0,00'}\n`;
            corpo += `• Salário Médio: R$ ${estatisticas.salario_medio || '0,00'}\n\n`;

            if (dados.por_cargo) {
                corpo += `📋 DISTRIBUIÇÃO POR CARGO\n`;
                for (const [cargo, dadosCargo] of Object.entries(dados.por_cargo)) {
                    corpo += `\n${cargo.toUpperCase().replace('_', ' ')} (${dadosCargo.total} funcionários)\n`;
                    corpo += `  Total Salários: R$ ${parseFloat(dadosCargo.total_salarios || 0).toFixed(2)}\n`;
                    corpo += `  Salário Médio: R$ ${dadosCargo.total > 0 ? parseFloat(dadosCargo.total_salarios / dadosCargo.total).toFixed(2) : '0,00'}\n`;
                }
                corpo += '\n';
            }

            corpo += `📋 LISTA COMPLETA DE FUNCIONÁRIOS\n`;
            corpo += '='.repeat(60) + '\n';

            if (dados.funcionarios && dados.funcionarios.length > 0) {
                dados.funcionarios.forEach(func => {
                    corpo += `\n${func.nome_completo}\n`;
                    corpo += `Matrícula: ${func.matricula || 'N/A'}\n`;
                    corpo += `CPF: ${func.cpf || 'N/A'}\n`;
                    corpo += `Cargo: ${func.cargo || 'N/A'}\n`;
                    corpo += `Salário: R$ ${parseFloat(func.salario || 0).toFixed(2)}\n`;
                    corpo += `Turno: ${func.turno || 'N/A'}\n`;
                    corpo += `Data Admissão: ${func.data_admissao || 'N/A'}\n`;
                    corpo += `Status: ${func.ativo == 1 ? 'Ativo' : 'Inativo'}\n`;
                    corpo += `Telefone: ${func.telefone_celular || 'N/A'}\n`;
                    corpo += `Email: ${func.email || 'N/A'}\n`;
                    corpo += `Endereço: ${func.rua}, ${func.numero} - ${func.bairro}, ${func.cidade}-${func.estado}\n`;
                    corpo += `Nível Acesso: ${func.nivel_acesso || 'funcionario'}\n`;
                    corpo += `Total Pedidos: ${func.total_pedidos || 0}\n`;
                    corpo += `Total Vendas: R$ ${parseFloat(func.total_vendas || 0).toFixed(2)}\n`;
                    corpo += '-'.repeat(40) + '\n';
                });
            } else {
                corpo += 'Nenhum funcionário cadastrado.\n';
            }
            break;
    }

    const rodape = '\n' + '='.repeat(60) + '\n';
    rodape += `Relatório gerado automaticamente pelo BurgerSystem\n`;
    rodape += `Data/Hora: ${dataHora}\n`;
    rodape += '© ' + new Date().getFullYear() + ' - Todos os direitos reservados\n';

    return {
        texto: cabecalho + corpo + rodape,
        info: info
    };
}

function gerarRelatorioBasicoLocal(tipo, numero, dataInicio, dataFinal, responsavel) {
    let conteudo = `📊 RELATÓRIO BÁSICO - ${getNomeRelatorio(tipo).toUpperCase()}\n`;
    conteudo += `Número: ${numero}\n`;
    conteudo += `Data: ${dataInicio} a ${dataFinal || dataInicio}\n`;
    conteudo += `Responsável: ${responsavel}\n`;
    conteudo += `Gerado em: ${new Date().toLocaleString()}\n`;
    conteudo += `⚠️ MODO OFFLINE - Dados limitados\n\n`;

    switch (tipo) {
        case 'pedidos':
            conteudo += `Total de Pedidos no Sistema: ${pedidos.length}\n`;
            conteudo += `Pedidos Recentes (últimos 10):\n`;
            pedidos.slice(0, 10).forEach(p => {
                conteudo += `- #${p.numero_pedido || p.id}: ${p.nome_cliente || 'Cliente'} - R$ ${parseFloat(p.total || 0).toFixed(2)} - ${p.status || 'N/A'}\n`;
            });
            break;
        case 'estoque':
            conteudo += `Total de Itens no Estoque: ${estoque.length}\n`;
            conteudo += `Itens Críticos:\n`;
            const criticos = estoque.filter(i => i.status === "critico");
            if (criticos.length > 0) {
                criticos.forEach(i => {
                    conteudo += `- ${i.item}: ${i.quantidade} ${i.unidade} (mínimo: ${i.minimo})\n`;
                });
            } else {
                conteudo += `Nenhum item crítico.\n`;
            }
            break;
        case 'cardapio':
            conteudo += `Total de Itens no Cardápio: ${cardapio.length}\n`;
            conteudo += `Itens Disponíveis: ${cardapio.filter(i => i.disponivel).length}\n`;
            conteudo += `Itens Indisponíveis: ${cardapio.filter(i => !i.disponivel).length}\n`;
            conteudo += `Exemplos de Itens:\n`;
            cardapio.slice(0, 5).forEach(item => {
                conteudo += `- ${item.nome}: R$ ${parseFloat(item.preco || 0).toFixed(2)} (${item.disponivel ? 'Disponível' : 'Indisponível'})\n`;
            });
            break;
        case 'financeiro':
            const totalVendas = pedidos.reduce((sum, p) => sum + (parseFloat(p.total) || 0), 0);
            conteudo += `Total em Vendas: R$ ${totalVendas.toFixed(2)}\n`;
            conteudo += `Número de Pedidos: ${pedidos.length}\n`;
            conteudo += `Ticket Médio: R$ ${(pedidos.length > 0 ? totalVendas / pedidos.length : 0).toFixed(2)}\n`;
            conteudo += `Pedidos Entregues: ${pedidos.filter(p => p.status === 'entregue').length}\n`;
            break;
        case 'funcionarios':
            conteudo += `⚠️ Dados de funcionários não disponíveis em modo offline.\n`;
            conteudo += `Conecte-se ao sistema para gerar relatório completo.\n`;
            break;
        default:
            conteudo += `Tipo de relatório não suportado em modo offline.\n`;
    }

    baixarRelatorioArquivo(conteudo, numero, tipo + '_basico_offline');
}

function atualizarSelectTiposRelatorio() {
    const select = document.getElementById('relatorio-tipo');
    if (select) {
        select.innerHTML = `
            <option value="">Selecione o tipo de relatório</option>
            <option value="pedidos">📊 Relatório de Pedidos</option>
            <option value="estoque">📦 Relatório de Estoque</option>
            <option value="cardapio">🍔 Relatório do Cardápio</option>
            <option value="financeiro">💰 Relatório Financeiro</option>
            <option value="funcionarios">👥 Relatório de Funcionários</option>
        `;
    }
}

document.addEventListener('DOMContentLoaded', function () {
    if (isPaginaRelatorios()) {
        atualizarSelectTiposRelatorio();
        preencherDataHoraRelatorio();
    }
});

// ====== MUDANÇA RELATÓRIO ======

function limparFiltrosRelatorio() {
    const dataInicio = document.getElementById("relatorio-data-inicio");
    const dataFim = document.getElementById("relatorio-data-final");
    const matricula = document.getElementById("relatorio-responsavel");

    if (dataInicio) dataInicio.value = "";
    if (dataFim) dataFim.value = "";
    if (matricula) matricula.value = "";

}

// ====== FIM MUDANÇA RELATÓRIO ======

// ==================== FIM SISTEMA DE RELATÓRIO ====================


// ==================== SISTEMA DE HISTÓRICO ====================

function inicializarAbas(seletorAbas, seletorConteudos) {
    document.querySelectorAll(seletorAbas).forEach(tab => {
        tab.addEventListener('click', function () {
            document.querySelectorAll(seletorAbas).forEach(t => t.classList.remove('active'));
            document.querySelectorAll(seletorConteudos).forEach(c => c.classList.remove('active'));
            this.classList.add('active');

            const tabId = this.getAttribute('data-tab');
            const targetContent = document.getElementById(tabId);
            if (targetContent) targetContent.classList.add('active');
        });
    });
}

function resetarAbasSecao(secaoId) {
    if (secaoId === 'configuracoes') {
        document.querySelectorAll('.config-tab').forEach(tab => tab.classList.remove('active'));
        document.querySelectorAll('.config-content').forEach(content => content.classList.remove('active'));
        const primeiraAba = document.querySelector('.config-tab[data-tab="geral"]');
        const primeiroConteudo = document.getElementById('geral');
        if (primeiraAba) primeiraAba.classList.add('active');
        if (primeiroConteudo) primeiroConteudo.classList.add('active');
    } else if (secaoId === 'historico') {
        document.querySelectorAll('.historico-tab').forEach(tab => tab.classList.remove('active'));
        document.querySelectorAll('.historico-content').forEach(content => content.classList.remove('active'));
        const primeiraAba = document.querySelector('.historico-tab[data-tab="historico-pedidos"]');
        const primeiroConteudo = document.getElementById('historico-pedidos');
        if (primeiraAba) primeiraAba.classList.add('active');
        if (primeiroConteudo) primeiroConteudo.classList.add('active');
    }
}

function verDetalhesPedido(numeroPedido) {
    const detalhes = document.getElementById(`detalhes-pedido-${numeroPedido}`);
    if (!detalhes) return;

    const todosDetalhes = document.querySelectorAll('.detalhes-pedido');

    // Verifica se o que foi clicado já está aberto
    const jaAtivo = detalhes.classList.contains('active');

    // Fecha todos primeiro
    todosDetalhes.forEach(d => d.classList.remove('active'));

    // Se NÃO estava ativo, abre; se já estava, deixa tudo fechado
    if (!jaAtivo) {
        detalhes.classList.add('active');
    }
}

function exportarHistorico() {
    alert('Exportando relatório completo do histórico...');
}

// ==================== HISTÓRICO DE PEDIDOS ====================

function parseDataBRParaDate(textoData) {
    if (!textoData) return null;
    const partes = textoData.split('/');
    if (partes.length !== 3) return null;
    const dia = parseInt(partes[0], 10);
    const mes = parseInt(partes[1], 10) - 1; // mês começa em 0
    const ano = parseInt(partes[2], 10);
    const d = new Date(ano, mes, dia);
    return isNaN(d.getTime()) ? null : d;
}

function aplicarFiltrosHistoricoPedidos() {
    const secao = document.getElementById('historico-pedidos');
    if (!secao) return;

    const periodoSelect = secao.querySelector('#filtro-periodo-pedidos');
    const statusSelect = secao.querySelector('#filtro-status-pedidos');
    const clienteInput = secao.querySelector('#filtro-cliente-pedidos');

    const periodo = periodoSelect ? periodoSelect.value : '';
    const status = statusSelect ? statusSelect.value : 'Todos';
    const cliente = clienteInput ? clienteInput.value.trim().toLowerCase() : '';

    const hoje = new Date();
    const linhas = secao.querySelectorAll('tbody tr');

    linhas.forEach(tr => {
        // Não decide ainda sobre a linha de detalhes aqui
        if (tr.classList.contains('detalhes-pedido')) return;

        const tds = tr.querySelectorAll('td');
        if (tds.length === 0) return;

        const textoPedido = tds[0]?.textContent.trim();        // ex: "#0045"
        const textoData = tds[1]?.textContent.trim();        // ex: "15/11/2023"
        const textoCliente = tds[3]?.textContent.trim().toLowerCase();
        const textoStatus = tds[6]?.textContent.trim();        // ex: "Entregue"

        let mostrar = true;

        // ----- FILTRO POR STATUS -----
        if (status && status !== 'Todos') {
            if (!textoStatus || !textoStatus.toLowerCase().includes(status.toLowerCase())) {
                mostrar = false;
            }
        }

        // ----- FILTRO POR CLIENTE (texto digitado) -----
        if (mostrar && cliente) {
            if (!textoCliente || !textoCliente.includes(cliente)) {
                mostrar = false;
            }
        }

        // ----- FILTRO POR PERÍODO (data) -----
        if (mostrar && periodo) {
            const dataPedido = parseDataBRParaDate(textoData);
            if (dataPedido) {
                const diffMs = hoje - dataPedido;
                const diffDias = diffMs / (1000 * 60 * 60 * 24);

                if (periodo === 'Últimos 7 dias' && diffDias > 7) {
                    mostrar = false;
                } else if (periodo === 'Últimos 30 dias' && diffDias > 30) {
                    mostrar = false;
                } else if (periodo === 'Este mês') {
                    if (dataPedido.getMonth() !== hoje.getMonth() || dataPedido.getFullYear() !== hoje.getFullYear()) {
                        mostrar = false;
                    }
                }
                // "Personalizado" por enquanto não aplica nada adicional
            }
        }

        // Aplica o resultado na linha principal
        tr.style.display = mostrar ? '' : 'none';

        // Sincroniza a linha de detalhes (timeline), se existir
        if (textoPedido) {
            const numero = textoPedido.replace('#', '').trim(); // "#0045" -> "0045"
            const detalhes = document.getElementById('detalhes-pedido-' + numero);
            if (detalhes) {
                detalhes.style.display = mostrar ? '' : 'none';
            }
        }
    });
}

// Inicializa filtros do histórico quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function () {
    const secao = document.getElementById('historico-pedidos');
    if (!secao) return;

    const periodoSelect = secao.querySelector('#filtro-periodo-pedidos');
    const statusSelect = secao.querySelector('#filtro-status-pedidos');
    const clienteInput = secao.querySelector('#filtro-cliente-pedidos');

    if (periodoSelect) periodoSelect.addEventListener('change', aplicarFiltrosHistoricoPedidos);
    if (statusSelect) statusSelect.addEventListener('change', aplicarFiltrosHistoricoPedidos);
    if (clienteInput) clienteInput.addEventListener('input', aplicarFiltrosHistoricoPedidos);

    // Já aplica uma vez ao carregar
    aplicarFiltrosHistoricoPedidos();
});

function filtrarPedidosPorCliente() {
    const secao = document.getElementById('historico-pedidos');
    if (!secao) return;

    const inputCliente = secao.querySelector('#filtro-cliente-pedidos');
    const filtro = inputCliente.value.trim().toLowerCase();

    const linhas = secao.querySelectorAll('tbody tr');

    linhas.forEach(tr => {
        // Ignorar linha da timeline (detalhes)
        if (tr.classList.contains('detalhes-pedido')) return;

        const colunaCliente = tr.querySelector('td:nth-child(4)');
        if (!colunaCliente) return;

        const nome = colunaCliente.textContent.trim().toLowerCase();
        const mostrar = nome.includes(filtro);

        tr.style.display = mostrar ? '' : 'none';

        // sincronizar linha de detalhes
        const numPedido = tr.querySelector('td:nth-child(1)')?.textContent.replace('#', '').trim();
        const detalhes = document.getElementById('detalhes-pedido-' + numPedido);
        if (detalhes) {
            detalhes.style.display = mostrar ? '' : 'none';
        }
    });
}

document.addEventListener('DOMContentLoaded', function () {
    const inputCliente = document.getElementById('filtro-cliente-pedidos');
    if (inputCliente) {
        inputCliente.addEventListener('input', filtrarPedidosPorCliente);
    }
});

// ==================== HISTÓRICO DE ESTOQUE ====================

function aplicarFiltrosHistoricoEstoque() {
    const secao = document.getElementById('historico-estoque');
    if (!secao) return;

    const produtoSelecionado = document.getElementById('filtro-produto-estoque').value;
    const tipoSelecionado = document.getElementById('filtro-tipo-estoque').value;

    const linhas = secao.querySelectorAll('tbody tr');

    linhas.forEach(tr => {
        const colProduto = tr.querySelector('td:nth-child(3)')?.textContent.trim();
        const colTipo = tr.querySelector('td:nth-child(4)')?.textContent.trim();

        let mostrar = true;

        // Filtro por produto
        if (produtoSelecionado !== "Todos os produtos") {
            if (!colProduto || colProduto !== produtoSelecionado) {
                mostrar = false;
            }
        }

        // Filtro por tipo de movimento
        if (mostrar && tipoSelecionado !== "Todos") {
            if (!colTipo || !colTipo.includes(tipoSelecionado)) {
                mostrar = false;
            }
        }

        tr.style.display = mostrar ? '' : 'none';
    });
}

document.addEventListener('DOMContentLoaded', function () {
    const filtroProduto = document.getElementById('filtro-produto-estoque');
    const filtroTipo = document.getElementById('filtro-tipo-estoque');

    if (filtroProduto) filtroProduto.addEventListener('change', aplicarFiltrosHistoricoEstoque);
    if (filtroTipo) filtroTipo.addEventListener('change', aplicarFiltrosHistoricoEstoque);
});

// ==================== HISTÓRICO DE RELATÓRIO FINANCEIRO ====================
function visualizarRelatorioSimples(botao) {
    try {
        if (!botao) {
            const evt = window.event;
            if (evt && evt.target) {
                botao = evt.target;
            }
        }

        if (!botao) {
            alert('Não foi possível identificar o relatório selecionado.');
            return;
        }

        const linha = botao.closest('tr');
        if (!linha) {
            alert('Linha do relatório não encontrada.');
            return;
        }

        const celulas = linha.querySelectorAll('td');
        const dataHora = (celulas[0]?.innerText || '').trim();
        const titulo = (celulas[1]?.innerText || '').trim();
        const tipo = (celulas[2]?.innerText || '').trim();
        const acao = (celulas[3]?.innerText || '').trim();
        const responsavel = (celulas[4]?.innerText || '').trim();
        const destinatario = (celulas[5]?.innerText || '').trim();

        const texto =
            'Data/Hora: ' + dataHora + '\n' +
            'Relatório: ' + titulo + '\n' +
            'Tipo: ' + tipo + '\n' +
            'Ação: ' + acao + '\n' +
            'Responsável: ' + responsavel + '\n' +
            'Destinatário: ' + destinatario + '\n';

        const info = {
            numero: titulo || 'Relatório',
            tipo: tipo || 'Histórico',
            data: dataHora || '',
            responsavel: responsavel || 'Não informado',
            destino: destinatario || ''
        };

        if (typeof visualizarRelatorioModal === 'function') {
            visualizarRelatorioModal(texto, info);
        } else {
            alert(texto);
        }

        setTimeout(() => {
            const modalContent = document.querySelector('.modal-relatorio-content');
            if (modalContent) {
                modalContent.style.color = '#000000';
                modalContent.querySelectorAll('*').forEach(el => {
                    el.style.color = '#000000';
                });
            }
        }, 50);

    } catch (e) {
        console.error('Erro ao visualizar relatório:', e);
        alert('Erro ao abrir a visualização do relatório.');
    }
}



async function baixarRelatorioPDF(botao) {
    try {
        // Compatível com onclick="baixarRelatorioPDF()" e onclick="baixarRelatorioPDF(this)"
        if (!botao) {
            const evt = window.event;
            if (evt && evt.target) {
                botao = evt.target;
            }
        }

        if (!botao) {
            alert('Não foi possível identificar o relatório selecionado.');
            return;
        }

        const linha = botao.closest('tr');
        if (!linha) {
            alert('Linha do relatório não encontrada.');
            return;
        }

        const tabelaOriginal = linha.closest('table');
        const cabecalhoOriginal = tabelaOriginal?.querySelector('thead tr');

        // Cria um container fora da tela para montar a mini-tabela
        const container = document.createElement('div');
        container.style.position = 'fixed';
        container.style.left = '-9999px';
        container.style.top = '0';
        container.style.background = '#ffffff';
        container.style.padding = '16px';
        container.style.fontFamily = 'Arial, sans-serif';
        container.style.fontSize = '12px';

        // Título do PDF
        const titulo = document.createElement('h3');
        titulo.textContent = 'Histórico de Relatórios - Linha Selecionada';
        titulo.style.marginBottom = '10px';
        container.appendChild(titulo);

        // Tabela que será "fotografada"
        const tabela = document.createElement('table');
        tabela.style.borderCollapse = 'collapse';
        tabela.style.width = '100%';

        // Cabeçalho
        const thead = document.createElement('thead');
        const trHead = document.createElement('tr');
        if (cabecalhoOriginal) {
            cabecalhoOriginal.querySelectorAll('th').forEach(thOrig => {
                const th = document.createElement('th');
                th.textContent = thOrig.textContent;
                th.style.border = '1px solid #dddddd';
                th.style.padding = '4px 6px';
                th.style.background = '#f5f5f5';
                th.style.fontWeight = 'bold';
                trHead.appendChild(th);
            });
        }
        thead.appendChild(trHead);
        tabela.appendChild(thead);

        // Corpo com APENAS a linha clicada
        const tbody = document.createElement('tbody');
        const trBody = document.createElement('tr');

        linha.querySelectorAll('td').forEach(tdOrig => {
            const td = document.createElement('td');
            // innerText pega o texto do badge, mas ignora os botões
            td.textContent = tdOrig.innerText;
            td.style.border = '1px solid #dddddd';
            td.style.padding = '4px 6px';
            trBody.appendChild(td);
        });

        tbody.appendChild(trBody);
        tabela.appendChild(tbody);

        container.appendChild(tabela);
        document.body.appendChild(container);

        // Usa html2canvas para tirar "print" do container
        const canvas = await html2canvas(container);
        const imgData = canvas.toDataURL('image/png');

        // Gera o PDF com jsPDF
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');

        const pageWidth = pdf.internal.pageSize.getWidth();
        const imgWidth = pageWidth - 20; // margem de 10mm de cada lado
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        pdf.addImage(imgData, 'PNG', 10, 20, imgWidth, imgHeight);

        // Nome do arquivo baseado no título da linha
        const celulas = linha.querySelectorAll('td');
        const nomeBase = (celulas[1]?.textContent.trim() || 'relatorio')
            .replace(/[^\w\-]+/g, '_'); // limpa caracteres estranhos

        pdf.save(`${nomeBase}.pdf`);

        // Remove o container temporário
        document.body.removeChild(container);

    } catch (e) {
        console.error('Erro ao gerar PDF do relatório:', e);
        alert('Erro ao gerar PDF. Tente novamente.');
    }
}


// ==================== FUNÇÕES DE EXPORTAÇÃO ====================
function exportarCardapioPublico() {
    const cardapioExport = {
        todosItens: cardapio.map(item => ({
            id: item.id,
            nome: item.nome,
            preco: item.preco,
            categoria: item.categoria,
            descricao: item.descricao,
            ingredientes: item.ingredientes,
            disponivel: item.disponivel,
            status: item.disponivel ? "Disponível" : "Indisponível"
        })),
        porCategoria: {
            hamburgueres: cardapio.filter(item => item.categoria === "hamburguer"),
            acompanhamentos: cardapio.filter(item => item.categoria === "acompanhamento"),
            bebidas: cardapio.filter(item => item.categoria === "bebida"),
            sobremesas: cardapio.filter(item => item.categoria === "sobremesa"),
            outros: cardapio.filter(item => !["hamburguer", "acompanhamento", "bebida", "sobremesa"].includes(item.categoria))
        },
        ultimaAtualizacao: new Date().toISOString(),
        estatisticas: {
            total: cardapio.length,
            disponiveis: cardapio.filter(i => i.disponivel).length,
            indisponiveis: cardapio.filter(i => !i.disponivel).length
        }
    };

    const dataStr = JSON.stringify(cardapioExport, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `cardapio-completo-${new Date().toISOString().split('T')[0]}.json`;
    link.click();

    alert(`✅ Cardápio exportado com sucesso!\n\n📊 Estatísticas:\n• Total de itens: ${cardapioExport.estatisticas.total}\n• Disponíveis: ${cardapioExport.estatisticas.disponiveis}\n• Indisponíveis: ${cardapioExport.estatisticas.indisponiveis}\n\n📁 Nome do arquivo: ${link.download}`);
}

// ==================== SISTEMA DE CONFIGURAÇÕES CORRIGIDO ====================

// Função para carregar configurações salvas
function carregarConfiguracoesSalvas() {
    console.log('Carregando configurações salvas...');

    // Verifica se está na página de configurações
    if (!document.getElementById('configuracoes')) {
        console.log('Não está na página de configurações');
        return;
    }

    // Carrega configurações do localStorage
    const configuracoesSalvas = localStorage.getItem('configuracoesSistema');

    if (configuracoesSalvas) {
        try {
            const config = JSON.parse(configuracoesSalvas);

            // Aplica configurações gerais
            if (config.nomeRestaurante) {
                const nomeEl = document.getElementById('nome-restaurante');
                if (nomeEl) nomeEl.value = config.nomeRestaurante;
            }

            if (config.cnpj) {
                const cnpjEl = document.getElementById('cnpj');
                if (cnpjEl) cnpjEl.value = config.cnpj;
            }

            if (config.telefone) {
                const telefoneEl = document.getElementById('telefone');
                if (telefoneEl) telefoneEl.value = config.telefone;
            }

            if (config.email) {
                const emailEl = document.getElementById('email');
                if (emailEl) emailEl.value = config.email;
            }

            // Carrega endereço se existir
            if (config.endereco) {
                const camposEndereco = ['rua', 'numero', 'complemento', 'bairro', 'cidade', 'estado', 'cep'];
                camposEndereco.forEach(campo => {
                    const elemento = document.getElementById(campo);
                    if (elemento && config.endereco[campo]) {
                        elemento.value = config.endereco[campo];
                    }
                });
            }

            // Carrega personalização
            if (config.personalizacao) {
                const temaEl = document.getElementById('tema-sistema');
                if (temaEl && config.personalizacao.tema) {
                    temaEl.value = config.personalizacao.tema;
                    // NÃO aplica o tema aqui - será aplicado pelo carregarTemaSalvo()
                }

                const idiomaEl = document.getElementById('idioma-sistema');
                if (idiomaEl && config.personalizacao.idioma) {
                    idiomaEl.value = config.personalizacao.idioma;
                }

                const corPrimariaEl = document.getElementById('cor-primaria');
                if (corPrimariaEl && config.personalizacao.corPrimaria) {
                    corPrimariaEl.value = config.personalizacao.corPrimaria;
                }

                const corSecundariaEl = document.getElementById('cor-secundaria');
                if (corSecundariaEl && config.personalizacao.corSecundaria) {
                    corSecundariaEl.value = config.personalizacao.corSecundaria;
                }

                // Carrega tamanho da fonte
                if (config.personalizacao.tamanhoFonte) {
                    const tamanhoFonteEl = document.getElementById('tamanho-fonte-config');
                    if (tamanhoFonteEl) {
                        tamanhoFonteEl.value = config.personalizacao.tamanhoFonte;
                        // NÃO aplica tamanho da fonte aqui - será aplicado pelo carregarTamanhoFonte()
                    }
                }
            }

            console.log('Configurações carregadas com sucesso:', config);

        } catch (error) {
            console.error('Erro ao carregar configurações:', error);
        }
    } else {
        console.log('Nenhuma configuração salva encontrada');
    }
}

// Função para inicializar o sistema de configurações
function inicializarConfiguracoes() {
    console.log('Inicializando sistema de configurações...');

    // Verifica se estamos na página de configurações
    if (!document.getElementById('configuracoes')) {
        console.log('Não está na página de configurações');
        return;
    }

    // Primeiro carrega as configurações salvas
    carregarConfiguracoesSalvas();

    // Configura evento para o botão salvar
    const btnSalvar = document.getElementById('btn-salvar');
    if (btnSalvar) {
        console.log('Configurando botão salvar...');
        btnSalvar.addEventListener('click', salvarConfiguracoes);
    } else {
        console.error('Botão salvar não encontrado!');
    }

    // Configura evento para preview do tamanho da fonte
    const selectTamanhoFonte = document.getElementById('tamanho-fonte-config');
    if (selectTamanhoFonte) {
        selectTamanhoFonte.addEventListener('change', function () {
            console.log('Preview - Tamanho alterado para:', this.value);
            aplicarTamanhoFonte(this.value);
        });
    }

    // Configura evento para o tema
    const selectTema = document.getElementById('tema-sistema');
    if (selectTema) {
        selectTema.addEventListener('change', function () {
            console.log('Tema alterado para:', this.value);
            aplicarTema(this.value);
        });
    }

    // Configura botão de reset
    const btnResetar = document.getElementById('btn-redefinir');
    if (btnResetar) {
        btnResetar.addEventListener('click', resetarConfiguracoes);
    }

    console.log('Sistema de configurações inicializado!');
}

// ===== SISTEMA DE TAMANHO DE FONTE =====
function aplicarTamanhoFonte(tamanho) {
    console.log('Aplicando tamanho de fonte:', tamanho);


    // Remove todas as classes de tamanho de fonte existentes
    document.body.classList.remove(
        'fonte-pequena',
        'fonte-padrao',
        'fonte-media',
        'fonte-grande'
    );


    // Adiciona a nova classe
    document.body.classList.add(tamanho);


    // Aplica tamanhos específicos para elementos que precisam de ajustes
    aplicarTamanhosEspecificos(tamanho);


    // Salva no localStorage para persistência
    localStorage.setItem('tamanhoFonte', tamanho);
    console.log('Tamanho de fonte salvo no localStorage:', tamanho);
}


function aplicarTamanhosEspecificos(tamanho) {
    const multiplicadores = {
        'fonte-pequena': 0.875,   // 87.5% do tamanho padrão
        'fonte-padrao': 1,        // 100% (tamanho padrão)
        'fonte-media': 1.125,     // 112.5% do tamanho padrão
        'fonte-grande': 1.25      // 125% do tamanho padrão
    };


    const multiplicador = multiplicadores[tamanho] || 1;


    // Elementos que precisam de ajustes específicos
    const elementosParaAjustar = [
        { seletor: '.card h3', tamanhoBase: '1.2rem' },
        { seletor: '.page-header h2', tamanhoBase: '1.8rem' },
        { seletor: '.numero-grande', tamanhoBase: '2.5rem' },
        { seletor: '.sidebar-menu a', tamanhoBase: '1rem' },
        { seletor: '.nav-menu a', tamanhoBase: '1rem' },
        { seletor: '.btn', tamanhoBase: '0.9rem' },
        { seletor: 'table th, table td', tamanhoBase: '0.9rem' },
        { seletor: '.form-control, .select-control', tamanhoBase: '1rem' },
        { seletor: '.alert', tamanhoBase: '0.9rem' },
        { seletor: '.badge', tamanhoBase: '0.85rem' }
    ];


    // Aplica os ajustes
    elementosParaAjustar.forEach(item => {
        const elementos = document.querySelectorAll(item.seletor);
        elementos.forEach(el => {
            const tamanhoBase = parseFloat(item.tamanhoBase);
            const novoTamanho = tamanhoBase * multiplicador;
            el.style.fontSize = `${novoTamanho}rem`;
        });
    });
}


function restaurarTamanhosPadrao() {
    const elementosComEstilo = document.querySelectorAll('[style*="font-size"]');
    elementosComEstilo.forEach(el => {
        el.style.fontSize = '';
    });
}


function carregarTamanhoFonte() {
    const tamanhoSalvo = localStorage.getItem('tamanhoFonte');
    const selectTamanhoFonte = document.getElementById('tamanho-fonte-config');


    console.log('Tamanho salvo encontrado:', tamanhoSalvo);


    if (tamanhoSalvo) {
        // Aplica o tamanho salvo
        aplicarTamanhoFonte(tamanhoSalvo);


        // Atualiza o select para refletir o valor salvo
        if (selectTamanhoFonte) {
            selectTamanhoFonte.value = tamanhoSalvo;
            console.log('Select atualizado para:', tamanhoSalvo);
        }
    } else {
        // Define o padrão se não houver valor salvo
        aplicarTamanhoFonte('fonte-padrao');
        if (selectTamanhoFonte) {
            selectTamanhoFonte.value = 'fonte-padrao';
        }
    }
}


function obterTamanhoFonteAtual() {
    const selectTamanhoFonte = document.getElementById('tamanho-fonte-config');
    return selectTamanhoFonte ? selectTamanhoFonte.value : 'fonte-padrao';
}


function mostrarFeedback(mensagem, tipo = 'success') {
    const feedbackExistente = document.getElementById('feedback-config');
    if (feedbackExistente) {
        feedbackExistente.remove();
    }


    const feedback = document.createElement('div');
    feedback.id = 'feedback-config';
    feedback.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        transition: all 0.3s ease;
        max-width: 300px;
        opacity: 0;
        transform: translateY(-20px);
    `;


    if (tipo === 'success') {
        feedback.style.backgroundColor = 'var(--verde)';
    } else if (tipo === 'error') {
        feedback.style.backgroundColor = 'var(--vermelho)';
    } else {
        feedback.style.backgroundColor = 'var(--azul)';
    }


    feedback.textContent = mensagem;
    document.body.appendChild(feedback);


    setTimeout(() => {
        feedback.style.opacity = '1';
        feedback.style.transform = 'translateY(0)';
    }, 100);


    setTimeout(() => {
        feedback.style.opacity = '0';
        feedback.style.transform = 'translateY(-20px)';
        setTimeout(() => {
            if (feedback.parentNode) {
                feedback.remove();
            }
        }, 300);
    }, 5000);
}


function salvarConfiguracoes() {
    console.log('Iniciando salvamento das configurações...');


    try {
        const tamanhoFonte = obterTamanhoFonteAtual();
        console.log('Tamanho de fonte selecionado:', tamanhoFonte);


        aplicarTamanhoFonte(tamanhoFonte);


        const dados = coletarDadosFormulario();


        localStorage.setItem('configuracoesSistema', JSON.stringify(dados));


        console.log('Configurações salvas com sucesso:', dados);


        mostrarFeedback('✅ Configurações salvas com sucesso! O tamanho da fonte foi atualizado.', 'success');


    } catch (error) {
        console.error('Erro ao salvar configurações:', error);
        mostrarFeedback('❌ Erro ao salvar configurações. Tente novamente.', 'error');
    }
}


function coletarDadosFormulario() {
    return {
        nomeRestaurante: document.getElementById('nome-restaurante')?.value || '',
        cnpj: document.getElementById('cnpj')?.value || '',
        telefone: document.getElementById('telefone')?.value || '',
        email: document.getElementById('email')?.value || '',
        endereco: {
            rua: document.getElementById('rua')?.value || '',
            numero: document.getElementById('numero')?.value || '',
            complemento: document.getElementById('complemento')?.value || '',
            bairro: document.getElementById('bairro')?.value || '',
            cidade: document.getElementById('cidade')?.value || '',
            estado: document.getElementById('estado')?.value || '',
            cep: document.getElementById('cep')?.value || ''
        },
        personalizacao: {
            tema: document.getElementById('tema-sistema')?.value || 'claro',
            idioma: document.getElementById('idioma-sistema')?.value || 'pt-br',
            corPrimaria: document.getElementById('cor-primaria')?.value || '#c1121f',
            corSecundaria: document.getElementById('cor-secundaria')?.value || '#ffdd57',
            tamanhoFonte: obterTamanhoFonteAtual()
        },
        timestamp: new Date().toISOString()
    };
}


function configurarPreviewTempoReal() {
    const selectTamanhoFonte = document.getElementById('tamanho-fonte-config');
    if (selectTamanhoFonte) {
        selectTamanhoFonte.addEventListener('change', function () {
            console.log('Preview - Tamanho de fonte alterado para:', this.value);
            aplicarTamanhoFonte(this.value);
        });
    }
}


function resetarConfiguracoes() {
    if (confirm('Tem certeza que deseja redefinir todas as configurações para os valores padrão?')) {
        localStorage.removeItem('tamanhoFonte');
        localStorage.removeItem('configuracoesSistema');


        aplicarTamanhoFonte('fonte-padrao');


        const selectTamanhoFonte = document.getElementById('tamanho-fonte-config');
        if (selectTamanhoFonte) {
            selectTamanhoFonte.value = 'fonte-padrao';
        }


        mostrarFeedback('🔄 Configurações redefinidas para os valores padrão!', 'success');


        setTimeout(() => {
            location.reload();
        }, 2000);
    }
}


// ===== SISTEMA DE TEMAS =====
function aplicarTema(tema) {
    const body = document.body;


    if (tema === 'automatico') {
        // Detecta preferência do sistema
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            body.setAttribute('data-tema', 'escuro');
        } else {
            body.setAttribute('data-tema', 'claro');
        }


        // Escuta mudanças na preferência do sistema
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
            if (document.getElementById('tema-sistema').value === 'automatico') {
                body.setAttribute('data-tema', e.matches ? 'escuro' : 'claro');
            }
        });
    } else {
        body.setAttribute('data-tema', tema);
    }


    // Salva preferência
    localStorage.setItem('temaPreferido', tema);
}


function carregarTemaSalvo() {
    const temaSalvo = localStorage.getItem('temaPreferido') || 'claro';
    const selectTema = document.getElementById('tema-sistema');


    if (selectTema) {
        selectTema.value = temaSalvo;
    }


    aplicarTema(temaSalvo);
}


function mostrarFeedbackTema(mensagem) {
    const feedbackExistente = document.getElementById('feedback-tema');
    if (feedbackExistente) {
        feedbackExistente.remove();
    }


    const feedback = document.createElement('div');
    feedback.id = 'feedback-tema';
    feedback.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 12px 20px;
        background-color: var(--tema-primario);
        color: white;
        border-radius: 8px;
        font-weight: 500;
        z-index: 10000;
        box-shadow: 0 4px 12px var(--tema-sombra);
        transition: all 0.3s ease;
        max-width: 250px;
        opacity: 0;
        transform: translateY(20px);
    `;


    feedback.textContent = mensagem;
    document.body.appendChild(feedback);


    setTimeout(() => {
        feedback.style.opacity = '1';
        feedback.style.transform = 'translateY(0)';
    }, 100);


    setTimeout(() => {
        feedback.style.opacity = '0';
        feedback.style.transform = 'translateY(20px)';
        setTimeout(() => {
            if (feedback.parentNode) {
                feedback.remove();
            }
        }, 300);
    }, 3000);
}


// Dark Mode Functionality
function alternarTema(tema) {
    if (tema === 'escuro') {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('tema', 'dark');
    } else {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('tema', 'claro');
    }
}


// Carregar tema salvo ao iniciar
document.addEventListener('DOMContentLoaded', function () {
    const temaSalvo = localStorage.getItem('tema');
    const selectTema = document.getElementById('tema-sistema');


    if (temaSalvo === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        if (selectTema) selectTema.value = 'escuro';
    }


    // Conectar select à função
    if (selectTema) {
        selectTema.addEventListener('change', function () {
            alternarTema(this.value);
        });
    }
});


// Limpar campos de endereço quando o CEP for apagado
function limparCamposEndereco() {
    const cep = document.getElementById('cep').value.replace(/\D/g, '');


    if (cep.length < 8) {
        const camposParaLimpar = ['rua', 'bairro', 'cidade', 'estado'];


        camposParaLimpar.forEach(campoId => {
            const campo = document.getElementById(campoId);
            if (campo) {
                campo.value = '';
                campo.removeAttribute('readonly');
                campo.classList.remove('campo-preenchido', 'campo-preenchido-final');
                campo.style.color = '';
            }
        });


        console.log('Campos de endereço limpos - CEP está vazio');
    }
}


// Inicialização completa
document.addEventListener('DOMContentLoaded', function () {
    console.log('Inicializando sistema completo...');


    // Carrega o tamanho de fonte salvo
    carregarTamanhoFonte();


    // Configura o event listener para o botão salvar
    const btnSalvar = document.getElementById('btn-salvar');
    if (btnSalvar) {
        btnSalvar.addEventListener('click', salvarConfiguracoes);
        console.log('Event listener do botão salvar configurado');
    }


    // Configura preview em tempo real (opcional)
    configurarPreviewTempoReal();


    // Configura botão de reset se existir
    const btnResetar = document.getElementById('btn-redefinir');
    if (btnResetar) {
        btnResetar.addEventListener('click', resetarConfiguracoes);
    }


    // Carrega tema
    carregarTemaSalvo();
});

// ======================================================================
// FECHAR MODAL
// ======================================================================
function fecharModalConfirmacao() {
    const modal = document.getElementById("modal-confirmacao");
    if (modal) modal.style.display = "none";
}



