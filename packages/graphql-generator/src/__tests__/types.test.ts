import { Source } from 'graphql';
import { generateTypes, GenerateTypesOptions, TypesTarget } from '..';
import { readSchema } from './utils';

describe('generateTypes', () => {
  const queries = `
    query GetBlog($id: ID!) {
      getBlog(id: $id) {
        id
        name
        posts {
          nextToken
          __typename
        }
        createdAt
        updatedAt
        __typename
      }
    }
  `;
  const sdlSchema = readSchema('blog-sdl.graphql');

  describe('targets', () => {
    const targets: TypesTarget[] = ['json', 'swift', 'typescript', 'flow', 'scala', 'flow-modern', 'angular'];
    const introspectionSchema = readSchema('blog-introspection.json');
    targets.forEach(target => {
      test(`basic ${target}`, async () => {
        const typesFromSdl = await generateTypes({ schema: sdlSchema, queries, target });
        const typesFromIntrospection = await generateTypes({ schema: introspectionSchema, target, queries, introspection: true });

        if (target !== 'json') {
          expect(typesFromSdl).toEqual(typesFromIntrospection);
        } else {
          expect(typesFromIntrospection).toMatchSnapshot();
        }
        expect(typesFromSdl).toMatchSnapshot();
      });
    });
  });

  describe('multipleSwiftFiles', () => {
    test('generates multiple files', async () => {
      const filename = 'queries.graphql';
      const options: GenerateTypesOptions = {
        schema: sdlSchema,
        queries: [new Source(queries, filename)],
        target: 'swift',
        multipleSwiftFiles: true,
      };

      const types = await generateTypes(options);
      expect(Object.keys(types)).toEqual(['Types.graphql.swift', `${filename}.swift`]);
      expect(types).toMatchSnapshot();
    });

    test('throws error if not using Source', async () => {
      const filename = 'queries.graphql';
      const options: GenerateTypesOptions = {
        schema: sdlSchema,
        queries: queries,
        target: 'swift',
        multipleSwiftFiles: true,
      };

      expect(generateTypes(options)).rejects.toThrow('Query documents must be of type Source[] when generating multiple Swift files.');
    });
  });

  describe('amplifyJsLibraryVersion', () => {
    test('generates angular types for v5 when value is 5 or undefined', async () => {
      const options: GenerateTypesOptions = {
        schema: sdlSchema,
        queries,
        target: 'angular',
        amplifyJsLibraryVersion: 5,
      };
      const typesV5 = await generateTypes(options);
      const typesUndefined = await generateTypes({ ...options, amplifyJsLibraryVersion: undefined });
      expect(typesV5).toEqual(typesUndefined);
      expect(typesV5).toMatchSnapshot();
    });
    test('generates angular types for v6 when value is 6', async () => {
      const options: GenerateTypesOptions = {
        schema: sdlSchema,
        queries,
        target: 'angular',
        amplifyJsLibraryVersion: 6,
      };
      const types = await generateTypes(options);
      expect(types).toMatchSnapshot();
    });
  });
});
