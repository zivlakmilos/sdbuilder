import fse from 'fs-extra';
import path from 'path';
import nodePandoc from 'node-pandoc';
import cheerio from 'cheerio';
import dateFormat from 'dateformat';

const pandoc = (src, args) => {
  return new Promise((resolve, reject) => {
    nodePandoc(src, args, (err, result) => {
      if (err) {
        reject(err);
        return;
      }

      resolve(result);
    });
  });
}

const copyAssets = (outputFolder, args, assets) => {
  const dirFrom = path.join(args.template, 'public');
  const dirTo = path.join(outputFolder, args.outputFolder);
  fse.copySync(dirFrom, dirTo);

  if (assets) {
    assets.forEach((el) => {
      const dirFrom = path.join(el);
      const dirTo = path.join(outputFolder, args.outputFolder, 'assets');
      fse.copySync(dirFrom, dirTo);
    });
  }
}

const postProcessHtmlToc = async ($) => {
  const container = $('#sdbuilder-toc');

  $(container).find('ul').each((i, ul) => {
    $(ul).addClass('nav flex-column fixed-column');
  });
  $(container).find('li').each((i, li) => {
    $(li).addClass('nav-item');
  });
  $(container).find('a').each((i, a) => {
    $(a).addClass('nav-link');
  });
}

const postProcessHtmlBody = async ($) => {
  const body = $('#sdbuilder-body');
  $(body).find('h1').each((i, h) => {
    const id = $(h).attr('id');
    $(h).removeAttr('id');
    let next = $(h).next();
    if (i > 0) {
      $(body).append('<hr class="divider" />');
    }
    $(body).append(`<section id="${id}" class="section"></section>`);

    const container = $(body).find(`#${id}`);
    $(container).append($(h));

    while (next.length && $(next)[0].name !== 'h1' && $(next)[0].name !== 'section') {
      const tmp = $(next).next();

      if ($(next)[0].name === 'p') {
        $(next).css('text-indent', '20px');
        $(next).css('text-align', 'justify');
      } else if ($(next)[0].name === 'table') {
        $(next).addClass('table');
        $(next).addClass('table-bordered');
      }
      $(container).append($(next));

      next = tmp;
    }
  });

  $(body).find('img').each((i, img) => {
    $(img).css('max-width', '100%');
  });

  const date = new Date($('#sdbuilder-date').text());
  $('#sdbuilder-date').text(dateFormat(date, 'dd.mm.yyyy.'));
  $('#sdbuilder-copyright-year').text(dateFormat(date, 'yyyy'));
}

const postProcessHtml = async (project) => {
  const filePath = path.join(project.outputFolder, project.html.outputFolder, 'index.html');
  const $ = cheerio.load(fse.readFileSync(filePath));

  await postProcessHtmlToc($);
  await postProcessHtmlBody($);
  fse.writeFileSync(filePath, $.html());
}

const compileHtml = async (project) => {
  const src = project.sources.join(' ');
  const args = [
    '-f', project.format,
    '-t', 'html',
    '--template', path.join(project.html.template, 'index.html'),
    '-s',
    '-o', path.join(project.outputFolder, project.html.outputFolder, 'index.html'),
  ];

  if (project.toc) {
    args.push('--toc');
  }

  if (project.bibliography) {
    args.push('--bibliography');
    args.push(project.bibliography);
    args.push('--citeproc')
  }
  if (project.biblatex) {
    args.push('--biblatex');
  }

  fse.mkdirSync(path.join(project.outputFolder, project.html.outputFolder), { recursive: true });
  fse.mkdirSync(path.join(project.outputFolder, project.html.outputFolder, 'assets'), { recursive: true });
  copyAssets(project.outputFolder, project.html, project.assets);

  await pandoc(src, args, err => console.log(err));

  await postProcessHtml(project);
}

const compilePdf = async (project) => {
  const src = project.sources.join(' ');
  const args = [
    '-f', project.format === 'markdown' ? 'markdown+rebase_relative_paths' : project.format,
    '-t', 'pdf',
    '--template', path.join(project.pdf.template, 'template.tex'),
    '-s',
    '-o', path.join(project.outputFolder, project.pdf.outputFolder, project.pdf.outputFileName),
    '--listings',
    '-V lang=rs-SR'
    //'--pdf-engine', 'xelatex',
  ];

  if (project.toc) {
    args.push('--toc');
  }

  if (project.bibliography) {
    args.push('--bibliography');
    args.push(project.bibliography);
    args.push('--citeproc')
  }
  if (project.biblatex) {
    args.push('--biblatex');
  }

  fse.mkdirSync(path.join(project.outputFolder, project.pdf.outputFolder), { recursive: true });

  await pandoc(src, args, err => console.log(err));
}

export const compile = async () => {
  const project = JSON.parse(fse.readFileSync(path.resolve('project.json')));

  if (project.targets.includes('html')) {
    await compileHtml(project);
  }
  if (project.targets.includes('pdf')) {
    await compilePdf(project);
  }

  console.log('Build compleated!');
}
