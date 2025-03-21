import React from 'react';

import { GROWI } from '@goofmint/growi-js';
import { h, Properties } from 'hastscript';
import rehypeStringify from 'rehype-stringify';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import type { Plugin } from 'unified';
import { unified } from 'unified';
import { Node } from 'unist';
import { visit } from 'unist-util-visit';

// import { getReactHooks } from '../react-hooks';

const growi = new GROWI();

declare const growiFacade : {
  react: typeof React,
};

export const helloGROWI = (Tag: React.FunctionComponent<any>): React.FunctionComponent<any> => {
  return ({ children, ...props }) => {
    try {
      const { include } = JSON.parse(props.title);
      if (include) {
        const { react } = growiFacade;
        const { useEffect, useState } = react;
        const [contents, setContents] = useState('');
        const getContent = async() => {
          const page = await growi.page({ path: children });
          const contents = await page.contents();
          const file = await unified()
            .use(remarkParse)
            .use(remarkRehype)
            .use(rehypeStringify)
            .process(contents);
          setContents(String(file));
        };

        useEffect(() => {
          getContent();
        }, []);
        return (
          <>
            <div dangerouslySetInnerHTML={{ __html: contents }} />
          </>
        );
      }
    }
    catch (err) {
      // console.error(err);
    }
    // Return the original component if an error occurs
    return (
      <Tag {...props}>{children}</Tag>
    );
  };
};

interface GrowiNode extends Node {
  name: string;
  data: {
    hProperties?: Properties;
    hName?: string;
    hChildren?: Node[] | { type: string, value: string, url?: string }[];
    [key: string]: any;
  };
  type: string;
  attributes: {[key: string]: string}
  children: GrowiNode[] | { type: string, value: string, url?: string }[];
  value: string;
  title?: string;
  url?: string;
}


export const remarkPlugin: Plugin = () => {
  return (tree: Node) => {
    visit(tree, 'leafDirective', (node: Node) => {
      const n = node as unknown as GrowiNode;
      if (n.name !== 'include') return;
      console.log(n);
      const data = n.data || (n.data = {});
      // Render your component
      const { value } = n.children[0] || { value: '' };
      data.hName = 'a'; // Tag name
      data.hChildren = [{ type: 'text', value }]; // Children
      // Set properties
      data.hProperties = {
        href: 'https://example.com/rss',
        title: JSON.stringify({ ...n.attributes, ...{ include: true } }), // Pass to attributes to the component
      };
    });
  };
};
